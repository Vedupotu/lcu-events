package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
)

//go:embed frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	app := NewApp()
	updater := NewUpdater(app)

	err := wails.Run(&options.App{
		Title:            "League Client Events",
		Width:            1200,
		Height:           800,
		MinWidth:         800,
		MinHeight:        600,
		Assets:           assets,
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 59, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
			updater,
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
