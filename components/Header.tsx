import Link from "next/link"

export default function Header() {
  return (
    <header className="flex items-center justify-between px-12 py-4">
      <div className="flex items-center space-x-16">
        <Link href="/" className="text-[#0D1321] text-[45px] font-bold font-hikasami">DB</Link>
        <nav className="flex space-x-12">
          <Link href="/join" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
            Join Debates
          </Link>
          <Link href="/rating" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
            Rating
          </Link>
          <Link href="/news" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
            News
          </Link>
        </nav>
      </div>
      <div className="flex items-center space-x-6">
        <div className="relative">
          <select
            className="border border-[#3E5C76] rounded-[8px] px-4 py-2 text-[#0D1321] bg-white text-[14px] font-medium appearance-none bg-no-repeat bg-right bg-[length:16px] pr-10 hover:border-[#748CAB] focus:outline-none focus:ring-2 focus:ring-[#3E5C76] focus:ring-opacity-20 transition-all duration-200 cursor-pointer min-w-[100px] shadow-sm"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%233E5C76%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")',
            }}
          >
            <option>🇺🇸 English</option>
            <option>🇷🇺 Русский</option>
            <option>🇰🇿 Қазақша</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#9a8c98] rounded-full"></div>
          <span className="text-[#0D1321] text-[16px] font-normal">User1120023</span>
        </div>
      </div>
    </header>
  )
} 