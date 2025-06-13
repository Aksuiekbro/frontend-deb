export default function Header() {
  return (
    <header className="flex items-center justify-between px-12 py-4">
      <div className="flex items-center space-x-16">
        <div className="text-[#0D1321] text-[45px] font-bold font-hikasami">DB</div>
        <nav className="flex space-x-12">
          <a href="#" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
            Join Debates
          </a>
          <a href="#" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
            Rating
          </a>
        </nav>
      </div>
      <div className="flex items-center space-x-6">
        <select
          className="border border-[#9a8c98] rounded-[4px] px-4 py-2 text-[#4a4e69] bg-white text-[16px] font-normal appearance-none bg-no-repeat bg-right bg-[length:12px] pr-8"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"%3E%3Cpath fill="%23666" d="M2 0L0 2h4zm0 5L0 3h4z"/%3E%3C/svg>\')',
          }}
        >
          <option>English</option>
        </select>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#9a8c98] rounded-full"></div>
          <span className="text-[#0D1321] text-[16px] font-normal">User1120023</span>
        </div>
      </div>
    </header>
  )
} 