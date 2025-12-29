import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { FilterProvider } from './context/FilterContext'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey} afterSignInUrl="/" afterSignUpUrl="/">
      <FilterProvider>
        <App />
      </FilterProvider>
    </ClerkProvider>
  </StrictMode>,
)
