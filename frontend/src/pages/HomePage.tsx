import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section
      aria-labelledby="home-title"
      className="grid overflow-hidden rounded-3xl bg-[#25134f] text-white md:grid-cols-[1fr_0.92fr]"
    >
      <div className="flex flex-col items-start justify-center px-7 py-10 sm:px-12 sm:py-14">
        <h1 className="banner-title font-bold" id="home-title">
          Make plans.<br />Meet your people.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-violet-100 sm:text-lg">
          Discover community events, RSVP to the ones you like, or host a meetup of your own.
        </p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center rounded-full bg-white px-5 font-semibold text-violet-950 transition-colors hover:bg-violet-100 focus-visible:outline-white"
          to="/events"
        >
          Explore events
        </Link>
      </div>
      <img
        alt="People chatting around a table at a community meetup"
        className="h-56 w-full object-cover object-center sm:h-72 md:h-full"
        fetchPriority="high"
        height="800"
        src="/community-meetup.jpg"
        width="1200"
      />
    </section>
  )
}
