import './globals.css'
import Providers from './providers'
import Link from 'next/link'

export const metadata = {
  title: 'Agora',
  description: 'Simple directory of teachers, monasteries, and retreats',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="container">
            <header className="header" style={{justifyContent:'space-between'}}>
              <div>
                <h1>
                  <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Agora</Link>
                </h1>
                <p>Explore teachers, monasteries, retreats, and events</p>
              </div>
              <div className="row">
                <a href="/graph" className="button" style={{marginRight:8}}>🕉️ Graph</a>
                <a href="/add" className="button" style={{marginRight:8}}>Add Item</a>
                <a href="/api/auth/signin/google" className="button" style={{marginRight:8}}>Sign In</a>
                <a href="/api/auth/signout" className="tab">Sign Out</a>
              </div>
            </header>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
