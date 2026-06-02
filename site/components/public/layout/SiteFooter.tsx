export function SiteFooter() {
  return (
    <footer className='site-footer'>
      <div className='container site-footer__inner'>
        <p>© {new Date().getFullYear()} BeKaPaKa Bobolice</p>
        <a href='mailto:kontakt@bekapaka.pl'>kontakt@bekapaka.pl</a>
      </div>
    </footer>
  )
}
