import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';
import { FaGithub, FaDiscord, FaLinkedin } from 'react-icons/fa';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

interface DocumentationProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Documentation({ isOpen, onClose }: DocumentationProps) {
    const { theme } = useTheme();

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="relative z-50"
        >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel
                    className={cn(
                        "mx-auto max-w-4xl w-full rounded-lg p-6 shadow-xl",
                        theme === 'dark' ? 'bg-base-dark' : 'bg-base'
                    )}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <BookOpenIcon className="h-6 w-6 text-blue" />
                            <Dialog.Title className={cn(
                                "text-xl font-semibold",
                                theme === 'dark' ? 'text-text-dark' : 'text-text'
                            )}>
                                Documentation
                            </Dialog.Title>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className={cn(
                                "transition-colors",
                                theme === 'dark' ? 'text-subtext0-dark hover:text-text-dark' : 'text-subtext0 hover:text-text'
                            )}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className={cn(
                        "space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto pr-4",
                        theme === 'dark' ? 'text-text-dark' : 'text-text'
                    )}>
                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-blue">Getting Started</h2>
                            <p className="mb-4">
                                League Client Events is a tool that allows you to monitor and analyze events from the League of Legends client.
                                Double-click any event in the list to view its detailed information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-blue">Features</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium mb-2">Event Monitoring</h3>
                                    <p>View real-time events from the League client, including their type, URI, and data payload.</p>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-2">Filtering & Search</h3>
                                    <p>Filter events by type and search through event data to find specific information.</p>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-2">Breakpoints</h3>
                                    <p>Set breakpoints to mark specific points in the event stream for analysis.</p>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-2">Export & Import</h3>
                                    <p>Save your event data to JSON files and load them back later for analysis.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-blue">Controls</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium mb-2">Clear Events</h3>
                                    <p>Removes all events from the current view.</p>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-2">Set/Clear Breakpoint</h3>
                                    <p>Mark a specific point in the event stream or remove the current breakpoint.</p>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-2">Import/Export</h3>
                                    <p>Save your current event data to a file or load previously saved data.</p>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-2">Search & Filter</h3>
                                    <p>Search through events and filter by event type to find specific information.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-blue">Tips</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Use the search bar to find specific events or data</li>
                                <li>Double-click any event to view its full details</li>
                                <li>Export important event sequences for later analysis</li>
                                <li>Use breakpoints to mark significant moments in the event stream</li>
                                <li>Toggle between light and dark themes using the theme button</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-blue">About the Author</h2>
                            <div className="space-y-2">
                                <p>
                                    This tool was created and is maintained by <span className="font-semibold">Haze</span>.
                                </p>
                                <ul className="list-none pl-0 space-y-1">
                                    <li>
                                        <button
                                            onClick={() => BrowserOpenURL('https://github.com/Its-Haze')}
                                            className="text-blue hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                                        >
                                            <FaGithub className="w-4 h-4" />
                                            GitHub: Its-Haze
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => BrowserOpenURL('https://discord.com/users/165102125746094080')}
                                            className="text-blue hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                                        >
                                            <FaDiscord className="w-4 h-4" />
                                            Discord: @haze.dev
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => BrowserOpenURL('https://www.linkedin.com/in/erik-avakian-270738188')}
                                            className="text-blue hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                                            disabled
                                        >
                                            <FaLinkedin className="w-4 h-4" />
                                            LinkedIn: <span className="italic text-subtext0">(coming soon)</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </section>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}


