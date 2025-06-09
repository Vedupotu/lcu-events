import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import {
    XMarkIcon,
    SunIcon,
    MoonIcon,
    ClipboardDocumentIcon,
    ClipboardDocumentCheckIcon,
    ArrowsPointingOutIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    TrashIcon,
    FlagIcon,
    FlagIcon as FlagOffIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    BookOpenIcon,
    ArrowTopRightOnSquareIcon,
    ArrowDownIcon
} from '@heroicons/react/24/outline';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Documentation } from './Documentation';
import { FaGithub } from 'react-icons/fa';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

SyntaxHighlighter.registerLanguage('json', json);

interface Event {
    uri: string;
    eventType: string;
    data: any;
    timestamp: number;
}

interface ExportData {
    events: Event[];
    metadata: {
        exportTimestamp: number;
        filter: {
            search: string;
            eventType: string;
        };
        sort: {
            by: 'timestamp' | 'uri' | 'eventType';
            order: 'asc' | 'desc';
        };
    };
}

// Catppuccin Mocha theme colors
const mochaTheme = {
    rosewater: '#f5e0dc',
    flamingo: '#f2cdcd',
    pink: '#f5c2e7',
    mauve: '#cba6f7',
    red: '#f38ba8',
    maroon: '#eba0ac',
    peach: '#fab387',
    yellow: '#f9e2af',
    green: '#a6e3a1',
    teal: '#94e2d5',
    sky: '#89dceb',
    sapphire: '#74c7ec',
    blue: '#89b4fa',
    lavender: '#b4befe',
    text: '#cdd6f4',
    subtext1: '#bac2de',
    subtext0: '#a6adc8',
    overlay2: '#9399b2',
    overlay1: '#7f849c',
    overlay0: '#6c7086',
    surface2: '#585b70',
    surface1: '#45475a',
    surface0: '#313244',
    base: '#1e1e2e',
    mantle: '#181825',
    crust: '#11111b',
};

const catppuccinMocha = {
    'hljs': { background: '#181825', color: '#cdd6f4' },
    'hljs-string': { color: '#a6e3a1' },
    'hljs-number': { color: '#f9e2af' },
    'hljs-keyword': { color: '#89b4fa' },
    'hljs-literal': { color: '#f38ba8' },
    'hljs-title': { color: '#b4befe' },
    'hljs-section': { color: '#cba6f7' },
    'hljs-attr': { color: '#f5c2e7' },
    'hljs-variable': { color: '#fab387' },
    'hljs-comment': { color: '#6c7086' },
};

// Update the pulse animation to be more subtle
const styles = `
@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.15);
        opacity: 0.8;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes live-dot-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    70% {
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
}

.animate-live-dot-strong {
    animation: pulse 1.5s ease-in-out infinite, live-dot-pulse 2s infinite;
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Add version interface
interface VersionInfo {
    version: string;
    hasUpdate: boolean;
    updateAvailable: string;
}

interface Updater {
    UpdateApplication(): Promise<void>;
}

declare global {
    interface Window {
        runtime: {
            EventsOn(eventName: string, callback: (data: any) => void): void;
            EventsOff(eventName: string): void;
        };
        updater: Updater;
    }
}

export function EventList() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [copied, setCopied] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const [search, setSearch] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState('');
    const [sortBy, setSortBy] = useState<'timestamp' | 'uri' | 'eventType'>('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [breakpointIndex, setBreakpointIndex] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [lastEventTime, setLastEventTime] = useState<number>(Date.now());
    // Meow pop effect state
    const [meows, setMeows] = useState<{ id: number; x: number; y: number; }[]>([]);
    const meowId = useRef(0);
    const [isDocumentationOpen, setIsDocumentationOpen] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const breakpointRef = useRef<number | null>(null);
    const [versionInfo, setVersionInfo] = useState<VersionInfo>({
        version: '1.0.0',
        hasUpdate: false,
        updateAvailable: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Subscribe to LCU events
        window.runtime.EventsOn("lcu-event", (event: any) => {
            if (!isPaused) {
                const now = Date.now();
                setLastEventTime(now);
                setEvents(prev => [{
                    ...event,
                    timestamp: now
                }, ...prev].slice(0, 100)); // Keep last 100 events
            }
        });

        // Check for updates on startup
        window.runtime.EventsOn("version-info", (info: VersionInfo) => {
            setVersionInfo(info);
        });

        // Listen for update progress
        window.runtime.EventsOn("update-progress", (progress: number) => {
            console.log(`Update progress: ${progress}%`);
        });

        // Listen for update complete
        window.runtime.EventsOn("update-complete", () => {
            setIsUpdating(false);
            // You might want to show a message that the app will restart
        });

        return () => {
            window.runtime.EventsOff("lcu-event");
            window.runtime.EventsOff("version-info");
            window.runtime.EventsOff("update-progress");
            window.runtime.EventsOff("update-complete");
        };
    }, [isPaused]);

    // Get unique event types for dropdown
    const eventTypes = useMemo(() => {
        const types = new Set(events.map(e => e.eventType));
        return Array.from(types).sort();
    }, [events]);

    const handleSort = (column: 'timestamp' | 'uri' | 'eventType') => {
        if (sortBy === column) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    // Filtered and sorted events
    const filteredEvents = useMemo(() => {
        let filtered = events.filter(event => {
            const matchesType = eventTypeFilter ? event.eventType === eventTypeFilter : true;
            const searchLower = search.toLowerCase();
            const matchesSearch =
                event.uri.toLowerCase().includes(searchLower) ||
                event.eventType.toLowerCase().includes(searchLower) ||
                JSON.stringify(event.data).toLowerCase().includes(searchLower);
            return matchesType && matchesSearch;
        });
        filtered.sort((a, b) => {
            let cmp = 0;
            if (sortBy === 'timestamp') {
                cmp = a.timestamp - b.timestamp;
            } else if (sortBy === 'uri') {
                cmp = a.uri.localeCompare(b.uri);
            } else if (sortBy === 'eventType') {
                cmp = a.eventType.localeCompare(b.eventType);
            }
            return sortOrder === 'asc' ? cmp : -cmp;
        });
        return filtered;
    }, [events, search, eventTypeFilter, sortBy, sortOrder]);

    const handleCopy = async () => {
        if (selectedEvent) {
            await navigator.clipboard.writeText(JSON.stringify(selectedEvent.data, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClearEvents = () => {
        setEvents([]);
    };

    const handleSetBreakpoint = () => {
        setBreakpointIndex(filteredEvents.length - 1);
    };

    const handleClearBreakpoint = () => {
        setBreakpointIndex(null);
    };

    // Add a function to reset filters
    const handleResetFilters = () => {
        setSearch('');
        setEventTypeFilter('');
    };

    const spawnMeow = () => {
        // Randomize angle between -80deg and -10deg (in radians)
        const angle = (Math.random() * (80 - 10) + 10) * (Math.PI / 180);
        // Randomize distance (px)
        const distance = 60 + Math.random() * 40;
        // Calculate x/y offset (negative for top-left)
        const x = -Math.cos(angle) * distance;
        const y = -Math.sin(angle) * distance;
        setMeows(meows => [...meows, { id: meowId.current++, x, y }]);
    };

    const handleExport = () => {
        const exportData: ExportData = {
            events: filteredEvents,
            metadata: {
                exportTimestamp: Date.now(),
                filter: {
                    search,
                    eventType: eventTypeFilter
                },
                sort: {
                    by: sortBy,
                    order: sortOrder
                }
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lcu-events-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data: ExportData = JSON.parse(e.target?.result as string);
                setEvents(data.events);
                setSearch(data.metadata.filter.search);
                setEventTypeFilter(data.metadata.filter.eventType);
                setSortBy(data.metadata.sort.by);
                setSortOrder(data.metadata.sort.order);
            } catch (error) {
                console.error('Error importing events:', error);
                // You might want to show an error message to the user here
            }
        };
        reader.readAsText(file);
    };

    const handleUpdate = async () => {
        try {
            await window.updater.UpdateApplication();
        } catch (error) {
            console.error('Failed to update:', error);
        }
    };

    return (
        <TooltipProvider>
            <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-base-dark text-text-dark' : 'bg-base text-text'}`}>
                {/* Header */}
                <header className={cn(
                    "px-4 py-3 flex items-center justify-between border-b",
                    theme === 'dark' ? 'border-surface0-dark' : 'border-surface0'
                )}>
                    <div className="flex items-center gap-4">
                        <h1 className={cn(
                            "text-xl font-semibold",
                            theme === 'dark' ? 'text-text-dark' : 'text-text'
                        )}>
                            League Client Events
                        </h1>
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-sm cursor-pointer select-none transition-colors",
                                    isPaused
                                        ? theme === 'dark'
                                            ? 'bg-surface0-dark text-subtext0-dark'
                                            : 'bg-surface0 text-subtext0'
                                        : theme === 'dark'
                                            ? 'bg-red-900/40 text-red-400 font-semibold'
                                            : 'bg-red-100 text-red-600 font-semibold shadow-sm',
                                    'hover:brightness-110 active:scale-95'
                                )}
                                onClick={() => setIsPaused((prev) => !prev)}
                                title={isPaused ? 'Click to resume event updates' : 'Click to pause event updates'}
                            >
                                <span
                                    className={cn(
                                        "w-3 h-3 rounded-full mr-1 transition-colors",
                                        isPaused
                                            ? theme === 'dark'
                                                ? 'bg-subtext0-dark'
                                                : 'bg-subtext0'
                                            : theme === 'dark'
                                                ? 'bg-red-400'
                                                : 'bg-red-600',
                                        !isPaused && "animate-live-dot-strong"
                                    )}
                                />
                                {isPaused ? 'Paused' : 'Live'}
                            </div>
                            <div className={cn(
                                "text-sm",
                                theme === 'dark' ? 'text-subtext0-dark' : 'text-subtext0'
                            )}>
                                v{versionInfo.version}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Update Button */}
                        {versionInfo.hasUpdate && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleUpdate}
                                        disabled={isUpdating}
                                        className={cn(
                                            "transition-colors",
                                            theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                                        )}
                                    >
                                        <ArrowDownIcon className="h-4 w-4 mr-2" />
                                        {isUpdating ? 'Updating...' : 'Update Available'}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex items-center gap-2">
                                        <ArrowDownIcon className="h-4 w-4" />
                                        <span>Update to v{versionInfo.updateAvailable}</span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {/* GitHub Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("transition-colors", theme === 'dark' ? 'text-subtext0-dark hover:text-text-dark' : 'text-subtext0 hover:text-text')}
                                    onClick={() => BrowserOpenURL('https://github.com/Its-Haze/lcu-events')}
                                >
                                    <FaGithub className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    <FaGithub className="h-4 w-4" />
                                    <span>View on GitHub</span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                        {/* Documentation Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsDocumentationOpen(true)}
                                    className={cn(
                                        "transition-colors",
                                        theme === 'dark' ? 'text-subtext0-dark hover:text-text-dark' : 'text-subtext0 hover:text-text'
                                    )}
                                >
                                    <BookOpenIcon className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    <BookOpenIcon className="h-4 w-4" />
                                    <span>View Documentation</span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                        {/* Theme Toggle Button */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    className={cn(
                                        "transition-colors",
                                        theme === 'dark' ? 'text-subtext0-dark hover:text-text-dark' : 'text-subtext0 hover:text-text'
                                    )}
                                >
                                    {theme === 'dark' ? (
                                        <SunIcon className="h-5 w-5" />
                                    ) : (
                                        <MoonIcon className="h-5 w-5" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    {theme === 'dark' ? (
                                        <>
                                            <SunIcon className="h-4 w-4" />
                                            <span>Switch to Light Theme</span>
                                        </>
                                    ) : (
                                        <>
                                            <MoonIcon className="h-4 w-4" />
                                            <span>Switch to Dark Theme</span>
                                        </>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </header>

                {/* Toolbar for actions and filters */}
                <div className={cn(
                    "px-4 py-2 flex justify-center items-center gap-4 border-b shadow-sm",
                    theme === 'dark' ? 'border-[#232634] bg-mantle-dark' : 'border-surface0 bg-mantle'
                )}>
                    {/* Left: Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="destructive"
                                    onClick={handleClearEvents}
                                >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Clear Events
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    <TrashIcon className="h-4 w-4" />
                                    <span>Remove all events from the list</span>
                                </div>
                            </TooltipContent>
                        </Tooltip>

                        {breakpointIndex === null ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="default"
                                        onClick={handleSetBreakpoint}
                                    >
                                        <FlagIcon className="h-4 w-4 mr-2" />
                                        Set Breakpoint
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex items-center gap-2">
                                        <FlagIcon className="h-4 w-4" />
                                        <span>Set a breakpoint at the current end of the list</span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        onClick={handleClearBreakpoint}
                                    >
                                        <FlagOffIcon className="h-4 w-4 mr-2" />
                                        Clear Breakpoint
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex items-center gap-2">
                                        <FlagOffIcon className="h-4 w-4" />
                                        <span>Remove the current breakpoint</span>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => document.getElementById('import-input')?.click()}
                                >
                                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                                    Import
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    <ArrowUpTrayIcon className="h-4 w-4" />
                                    <span>Import events from a JSON file</span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                        <input
                            id="import-input"
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={handleExport}
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                    <span>Export current events to a JSON file</span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Right: Filters/Search */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-subtext0" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search URI, type, or data..."
                                className={cn(
                                    "pl-9 pr-3 py-1 rounded border outline-none transition-colors",
                                    theme === 'dark'
                                        ? 'bg-base-dark text-text-dark border-surface0-dark placeholder-subtext0-dark focus:border-blue-dark'
                                        : 'bg-base text-text border-surface0 placeholder-subtext0 focus:border-blue'
                                )}
                                style={{ minWidth: 220 }}
                            />
                        </div>

                        <select
                            value={eventTypeFilter}
                            onChange={e => setEventTypeFilter(e.target.value)}
                            className={cn(
                                "px-3 py-1 rounded border outline-none transition-colors",
                                theme === 'dark'
                                    ? 'bg-base-dark text-text-dark border-surface0-dark focus:border-blue-dark'
                                    : 'bg-base text-text border-surface0 focus:border-blue'
                            )}
                        >
                            <option value="">All Types</option>
                            {eventTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    onClick={handleResetFilters}
                                >
                                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                                    Reset Filters
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex items-center gap-2">
                                    <ArrowPathIcon className="h-4 w-4" />
                                    <span>Clear all filters and search terms</span>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden">
                    <div className="h-full overflow-auto">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                            <div className={cn(
                                "shadow-sm rounded-lg overflow-hidden",
                                theme === 'dark' ? 'bg-mantle-dark' : 'bg-mantle'
                            )}>
                                <table className="min-w-full table-fixed divide-y divide-surface0">
                                    <colgroup>
                                        <col className="w-32" />
                                        <col className="max-w-[400px] w-auto" />
                                        <col className="w-48" />
                                        <col className="w-32" />
                                    </colgroup>
                                    <thead className={cn(
                                        "sticky top-0 z-10",
                                        theme === 'dark' ? 'bg-base-dark' : 'bg-base'
                                    )}>
                                        <tr className={cn(
                                            "border-b",
                                            theme === 'dark' ? 'border-[#232634]' : 'border-surface0'
                                        )}>
                                            <th
                                                className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-subtext0-dark' : 'text-subtext0'} uppercase tracking-wider cursor-pointer select-none`}
                                                onClick={() => handleSort('timestamp')}
                                            >
                                                Time {sortBy === 'timestamp' && (sortOrder === 'asc' ? '▲' : '▼')}
                                            </th>
                                            <th
                                                className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-subtext0-dark' : 'text-subtext0'} uppercase tracking-wider cursor-pointer select-none`}
                                                onClick={() => handleSort('uri')}
                                            >
                                                URI {sortBy === 'uri' && (sortOrder === 'asc' ? '▲' : '▼')}
                                            </th>
                                            <th
                                                className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-subtext0-dark' : 'text-subtext0'} uppercase tracking-wider`}
                                            >
                                                Data Preview
                                            </th>
                                            <th
                                                className={`px-6 py-3 text-right text-xs font-medium ${theme === 'dark' ? 'text-subtext0-dark' : 'text-subtext0'} uppercase tracking-wider cursor-pointer select-none`}
                                                onClick={() => handleSort('eventType')}
                                            >
                                                Event Type {sortBy === 'eventType' && (sortOrder === 'asc' ? '▲' : '▼')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className={`${theme === 'dark' ? 'bg-mantle-dark' : 'bg-mantle'} divide-y divide-surface0`}>
                                        <AnimatePresence initial={false}>
                                            {filteredEvents.map((event, index) => (
                                                <React.Fragment key={index}>
                                                    {breakpointIndex !== null && index === breakpointIndex + 1 && (
                                                        <tr>
                                                            <td colSpan={4} className="text-center py-2 bg-yellow-200 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 font-semibold">
                                                                Breakpoint
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <motion.tr
                                                        layout
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        transition={{ duration: 0.25 }}
                                                        className={`
                                                        cursor-pointer transition-colors
                                                        ${theme === 'dark' ? 'hover:bg-surface1-dark' : 'hover:bg-surface1'}
                                                        ${breakpointIndex !== null && index > breakpointIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                                                    `}
                                                        onClick={(e) => {
                                                            // Only open the event details if no text is selected
                                                            if (window.getSelection()?.toString().length === 0) {
                                                                setSelectedEvent(event);
                                                            }
                                                        }}
                                                    >
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-subtext0-dark' : 'text-subtext0'}`}>
                                                            {new Date(event.timestamp).toLocaleTimeString()}
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-text-dark' : 'text-text'} truncate max-w-[400px]`} title={event.uri}>
                                                            {event.uri}
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-subtext0-dark' : 'text-subtext0'} font-mono group relative`} title="Double-click to view full data">
                                                            <div className="flex items-center gap-2">
                                                                <span className="truncate">{JSON.stringify(event.data).slice(0, 60)}...</span>
                                                            </div>
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-subtext0-dark' : 'text-subtext0'} text-right`}>
                                                            {event.eventType}
                                                        </td>
                                                    </motion.tr>
                                                </React.Fragment>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Event Details Modal */}
                <Dialog
                    open={selectedEvent !== null}
                    onClose={() => setSelectedEvent(null)}
                    className="relative z-50"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel
                            className={cn(
                                "mx-auto max-w-2xl w-full rounded-lg p-6 shadow-xl",
                                theme === 'dark' ? 'bg-base-dark' : 'bg-base'
                            )}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <Dialog.Title className={cn(
                                    "text-lg font-semibold",
                                    theme === 'dark' ? 'text-text-dark' : 'text-text'
                                )}>
                                    Event Details
                                </Dialog.Title>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedEvent(null)}
                                    className={cn(
                                        "transition-colors",
                                        theme === 'dark' ? 'text-subtext0-dark hover:text-text-dark' : 'text-subtext0 hover:text-text'
                                    )}
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </Button>
                            </div>
                            {selectedEvent && (
                                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                                    <div>
                                        <h3 className={cn(
                                            "text-sm font-semibold mb-1",
                                            theme === 'dark' ? 'text-text-dark' : 'text-text'
                                        )}>
                                            Event Type
                                        </h3>
                                        <p className={cn(
                                            "font-mono text-base break-all",
                                            theme === 'dark' ? 'text-text-dark' : 'text-text'
                                        )}>{selectedEvent.eventType}</p>
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            "text-sm font-semibold mb-1",
                                            theme === 'dark' ? 'text-text-dark' : 'text-text'
                                        )}>
                                            URI
                                        </h3>
                                        <p className={cn(
                                            "font-mono text-base break-all",
                                            theme === 'dark' ? 'text-text-dark' : 'text-text'
                                        )}>{selectedEvent.uri}</p>
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            "text-sm font-semibold mb-1",
                                            theme === 'dark' ? 'text-text-dark' : 'text-text'
                                        )}>
                                            Timestamp
                                        </h3>
                                        <p className={cn(
                                            "font-mono text-base",
                                            theme === 'dark' ? 'text-text-dark' : 'text-text'
                                        )}>{selectedEvent && new Date(selectedEvent.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <h3 className={cn(
                                            "text-sm font-semibold mb-1",
                                            theme === 'dark' ? 'text-text-dark' : 'text-text'
                                        )}>
                                            Data
                                        </h3>
                                        <div className="relative rounded-md overflow-auto" style={{ maxHeight: 400 }}>
                                            <button
                                                onClick={async () => {
                                                    await navigator.clipboard.writeText(JSON.stringify(selectedEvent.data, null, 2));
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 1500);
                                                }}
                                                className={cn(
                                                    "absolute top-3 right-3 p-2 rounded-md transition-colors z-10",
                                                    theme === 'dark' ? 'bg-surface0-dark hover:bg-surface1-dark text-text-dark' : 'bg-surface0 hover:bg-surface1 text-text'
                                                )}
                                                title={copied ? 'Copied!' : 'Copy to clipboard'}
                                            >
                                                {copied ? (
                                                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <ClipboardDocumentIcon className="h-5 w-5" />
                                                )}
                                            </button>
                                            {copied && (
                                                <span
                                                    className={cn(
                                                        "absolute top-3 right-14 px-2 py-1 rounded bg-black/90 text-white text-xs font-bold shadow transition-opacity duration-300 z-10",
                                                        copied ? 'opacity-100' : 'opacity-0'
                                                    )}
                                                    style={{ textShadow: '0 1px 4px #000, 0 0 2px #000' }}
                                                >
                                                    Copied!
                                                </span>
                                            )}
                                            <SyntaxHighlighter
                                                language="json"
                                                style={theme === 'dark' ? catppuccinMocha : atomOneDark}
                                                customStyle={{
                                                    margin: 0,
                                                    borderRadius: '0.375rem',
                                                    padding: '1rem',
                                                    background: theme === 'dark' ? '#181825' : '#e6e9ef',
                                                    minHeight: '120px',
                                                }}
                                            >
                                                {JSON.stringify(selectedEvent.data, null, 2)}
                                            </SyntaxHighlighter>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Dialog.Panel>
                    </div>
                </Dialog>

                {/* Floating kitten button for cat mode */}
                <AnimatePresence>
                    <motion.button
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.5 }}
                        onClick={spawnMeow}
                        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-pink-200 hover:bg-pink-300 p-0 border-4 border-pink-400"
                        style={{ width: 64, height: 64 }}
                        title="Meow!"
                    >
                        <span role="img" aria-label="kitten" style={{ fontSize: 48, display: 'block', lineHeight: 1 }}>
                            🐾
                        </span>
                        <span style={{ position: 'absolute', left: 0, right: 0, bottom: -18, fontSize: 12, color: '#d72660', fontWeight: 700 }}>Meow!</span>
                    </motion.button>
                    {/* Animated meow popups */}
                    {meows.map(({ id, x, y }) => (
                        <motion.span
                            key={id}
                            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                            animate={{ opacity: 0, x, y, scale: 1.3 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                            className="fixed bottom-12 right-12 z-50 pointer-events-none select-none font-bold text-pink-600 text-lg drop-shadow-lg"
                            style={{ userSelect: 'none' }}
                            onAnimationComplete={() => setMeows(meows => meows.filter(m => m.id !== id))}
                        >
                            meow
                        </motion.span>
                    ))}
                </AnimatePresence>

                {/* Documentation Modal */}
                <Documentation
                    isOpen={isDocumentationOpen}
                    onClose={() => setIsDocumentationOpen(false)}
                />
            </div>
        </TooltipProvider>
    );
} 