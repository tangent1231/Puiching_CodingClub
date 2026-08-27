import Header from '../components/Header'
import Hero from '../components/Hero'
import Events from '../components/Events'
import AwardSearch from '../components/AwardSearch'
import Photos from '../components/Photos'
import Resources from '../components/Resources'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Events />
      <AwardSearch />
      <Photos />
      <Resources />
      <Footer />
    </main>
  )
}
