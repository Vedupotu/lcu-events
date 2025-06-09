interface Window {
    runtime: {
        EventsOn(eventName: string, callback: (data: any) => void): void;
        EventsOff(eventName: string): void;
    };
} 