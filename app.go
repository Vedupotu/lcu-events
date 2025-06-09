package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"time"

	lcu "github.com/its-haze/lcu-gopher"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	VERSION    = "1.0.0"
	REPO_OWNER = "Its-Haze"
	REPO_NAME  = "lcu-events"
	GITHUB_API = "https://api.github.com"
)

type VersionInfo struct {
	Version         string `json:"version"`
	HasUpdate       bool   `json:"hasUpdate"`
	UpdateAvailable string `json:"updateAvailable"`
}

// App struct
type App struct {
	ctx    context.Context
	client *lcu.Client
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	go a.checkForUpdates()

	// Create a new client with default configuration
	config := lcu.DefaultConfig()
	config.AwaitConnection = true

	client, err := lcu.NewClient(config)
	if err != nil {
		wailsruntime.LogError(a.ctx, "Failed to create client: "+err.Error())
		return
	}

	// Connect to the League Client
	if err := client.Connect(); err != nil {
		wailsruntime.LogError(a.ctx, "Failed to connect: "+err.Error())
		return
	}

	a.client = client

	// Subscribe to all events
	if err := client.SubscribeToAll(func(event *lcu.Event) {
		wailsruntime.EventsEmit(a.ctx, "lcu-event", map[string]interface{}{
			"uri":       event.URI,
			"eventType": event.EventType,
			"data":      event.Data,
		})
	}); err != nil {
		wailsruntime.LogError(a.ctx, "Failed to subscribe to events: "+err.Error())
		return
	}
}

// shutdown is called when the app is shutting down
func (a *App) shutdown(_ context.Context) {
	if a.client != nil {
		a.client.Disconnect()
	}
}

func (a *App) checkForUpdates() {
	// Wait a bit before checking for updates
	time.Sleep(2 * time.Second)

	versionInfo := VersionInfo{
		Version:         VERSION,
		HasUpdate:       false,
		UpdateAvailable: "",
	}

	// Check for updates
	latestVersion, err := getLatestVersion()
	if err != nil {
		wailsruntime.LogError(a.ctx, "Error checking for updates: "+err.Error())
		return
	}

	if latestVersion != VERSION {
		versionInfo.HasUpdate = true
		versionInfo.UpdateAvailable = latestVersion
	}

	// Emit version info to frontend
	wailsruntime.EventsEmit(a.ctx, "version-info", versionInfo)
}

func (a *App) UpdateApplication() error {
	// Get the latest release info
	release, err := getLatestRelease()
	if err != nil {
		return err
	}

	// Find the appropriate asset for the current platform
	var assetURL string
	for _, asset := range release.Assets {
		if asset.Name == fmt.Sprintf("lcu-events_%s_%s_%s.exe", VERSION, runtime.GOOS, runtime.GOARCH) {
			assetURL = asset.BrowserDownloadURL
			break
		}
	}

	if assetURL == "" {
		return fmt.Errorf("no suitable update found for your platform")
	}

	// Download the update
	resp, err := http.Get(assetURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Create a temporary file
	tempFile, err := os.CreateTemp("", "update-*.exe")
	if err != nil {
		return err
	}
	defer os.Remove(tempFile.Name())

	// Download with progress
	fileSize := resp.ContentLength
	downloaded := int64(0)
	buffer := make([]byte, 32*1024)

	for {
		nr, err := resp.Body.Read(buffer)
		if nr > 0 {
			nw, err := tempFile.Write(buffer[:nr])
			if err != nil {
				return err
			}
			if nr != nw {
				return io.ErrShortWrite
			}
			downloaded += int64(nw)
			progress := int((float64(downloaded) / float64(fileSize)) * 100)
			wailsruntime.EventsEmit(a.ctx, "update-progress", progress)
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}

	// Close the file
	tempFile.Close()

	// Launch the installer
	cmd := exec.Command(tempFile.Name())
	if err := cmd.Start(); err != nil {
		return err
	}

	// Emit update complete event
	wailsruntime.EventsEmit(a.ctx, "update-complete", nil)

	// Exit the application
	os.Exit(0)
	return nil
}

func getLatestVersion() (string, error) {
	release, err := getLatestRelease()
	if err != nil {
		return "", err
	}
	return release.TagName, nil
}

func getLatestRelease() (*GitHubRelease, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/releases/latest", GITHUB_API, REPO_OWNER, REPO_NAME)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get latest release: %s", resp.Status)
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}

	return &release, nil
}

type GitHubRelease struct {
	TagName string `json:"tag_name"`
	Assets  []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

// Add this struct
type Updater struct {
	app *App
}

func NewUpdater(app *App) *Updater {
	return &Updater{app: app}
}

func (u *Updater) UpdateApplication() error {
	return u.app.UpdateApplication()
}
