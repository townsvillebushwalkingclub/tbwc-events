const iconLinkClass =
  'inline-flex items-center justify-center w-11 h-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casper-orange focus-visible:ring-offset-2'

const socialLinkClass = `${iconLinkClass} border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50`

function GlobeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function FacebookGroupIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export default function SocialLinks() {
  return (
    <div className="flex justify-center items-center gap-3 mb-1">
      <a
        href="https://townsvillebushwalkingclub.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit official website"
        title="Visit official website"
        className={`${iconLinkClass} bg-casper-orange text-white hover:bg-casper-orange-hover shadow-sm`}
      >
        <GlobeIcon />
      </a>
      <a
        href="https://www.facebook.com/townsvillebushwalkingclub/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook page"
        title="Facebook page"
        className={`${socialLinkClass} hover:text-[#1877F2]`}
      >
        <FacebookIcon />
      </a>
      <a
        href="https://www.facebook.com/groups/townsvillebushwalking"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook group"
        title="Facebook group"
        className={socialLinkClass}
      >
        <FacebookGroupIcon />
      </a>
      <a
        href="https://instagram.com/townsvillebushwalkingclub/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram profile"
        title="Instagram profile"
        className={`${socialLinkClass} hover:text-[#E4405F]`}
      >
        <InstagramIcon />
      </a>
    </div>
  )
}
