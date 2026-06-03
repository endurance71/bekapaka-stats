import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

describe('App smoke', () => {
  it('renders login route without crashing', () => {
    window.history.pushState({}, '', '/login')
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    expect(screen.getByLabelText(/nazwisko/i)).toBeInTheDocument()
  })
})
