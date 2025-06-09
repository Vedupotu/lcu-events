import { EventList } from './components/EventList'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-base">
                <EventList />
            </div>
        </ThemeProvider>
    )
}

export default App
