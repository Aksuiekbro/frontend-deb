export default function Component() {
  return (
    <div className="min-h-screen bg-[#444444] p-8 font-hikasami">
      <div className="max-w-6xl mx-auto">
        {/* Typography Scale */}
        <div className="text-white text-sm mb-12 space-y-3 max-w-3xl">
          <div className="text-3xl font-bold">
            H1: A platform for meaningful discussions, structured debates, and intellectual growth
          </div>
          <div className="text-2xl font-semibold">
            H2: A platform for meaningful discussions, structured debates, and intellectual growth
          </div>
          <div className="text-xl font-medium">
            H3: A platform for meaningful discussions, structured debates, and intellectual growth
          </div>
          <div className="text-lg font-medium">
            H4: A platform for meaningful discussions, structured debates, and intellectual growth
          </div>
          <div className="text-base font-medium">
            H5: A platform for meaningful discussions, structured debates, and intellectual growth
          </div>
          <div className="text-sm font-normal">
            H6: A platform for meaningful discussions, structured debates, and intellectual growth
          </div>
        </div>

        {/* Primary Component - Debetter Card */}
        <div className="mb-16 flex justify-center">
          <div className="bg-[#f2e9e4] rounded-xl p-6 w-80 shadow-lg">
            {/* Header */}
            <div className="bg-[#22223b] rounded-lg p-6 mb-6">
              <h2 className="text-white text-xl font-semibold">
                Welcome to <span className="text-[#83c5be]">Debetter</span>
              </h2>
            </div>

            {/* Color Palette Rows */}
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="aspect-square rounded-lg bg-[#22223b]"></div>
                <div className="aspect-square rounded-lg bg-[#4a4e69]"></div>
                <div className="aspect-square rounded-lg bg-[#748cab]"></div>
                <div className="aspect-square rounded-lg bg-[#9a8c98]"></div>
              </div>

              <div className="text-[#22223b] text-base font-semibold">Debetter</div>

              <div className="grid grid-cols-4 gap-3">
                <div className="aspect-square rounded-lg bg-[#22223b]"></div>
                <div className="aspect-square rounded-lg bg-[#4a4e69]"></div>
                <div className="aspect-square rounded-lg bg-[#748cab]"></div>
                <div className="aspect-square rounded-lg bg-[#9a8c98]"></div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="aspect-square rounded-lg bg-[#22223b]"></div>
                <div className="aspect-square rounded-lg bg-[#4a4e69]"></div>
                <div className="aspect-square rounded-lg bg-[#748cab]"></div>
                <div className="aspect-square rounded-lg bg-[#9a8c98]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Gradient Strip */}
        <div className="mb-16 flex justify-center">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex rounded-lg overflow-hidden h-20 w-80">
              <div className="flex-1 bg-[#14213d]"></div>
              <div className="flex-1 bg-[#22223b]"></div>
              <div className="flex-1 bg-[#4a4e69]"></div>
              <div className="flex-1 bg-[#748cab]"></div>
              <div className="flex-1 bg-[#f0ebd8]"></div>
            </div>
          </div>
        </div>

        {/* Component Variations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Teal Theme */}
          <div className="bg-[#f0ebd8] rounded-xl p-6 shadow-lg">
            <div className="bg-[#006d77] rounded-lg p-6 mb-6">
              <h3 className="text-white text-xl font-semibold">
                Lorem <span className="text-[#83c5be]">Ipsum</span>
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="aspect-square rounded-lg bg-[#006d77]"></div>
              <div className="aspect-square rounded-lg bg-[#83c5be]"></div>
              <div className="aspect-square rounded-lg bg-[#e29578]"></div>
              <div className="aspect-square rounded-lg bg-[#9a8c98]"></div>
            </div>
          </div>

          {/* Blue Theme */}
          <div className="bg-[#f0ebd8] rounded-xl p-6 shadow-lg">
            <div className="bg-[#3e5c76] rounded-lg p-6 mb-6">
              <h3 className="text-white text-xl font-semibold">
                Lorem <span className="text-[#748cab]">Ipsum</span>
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="aspect-square rounded-lg bg-[#22223b]"></div>
              <div className="aspect-square rounded-lg bg-[#3e5c76]"></div>
              <div className="aspect-square rounded-lg bg-[#748cab]"></div>
              <div className="aspect-square rounded-lg bg-[#9a8c98]"></div>
            </div>
          </div>

          {/* Purple Theme */}
          <div className="bg-[#f0ebd8] rounded-xl p-6 shadow-lg">
            <div className="bg-[#4a4e69] rounded-lg p-6 mb-6">
              <h3 className="text-white text-xl font-semibold">
                Lorem <span className="text-[#c9ada7]">Ipsum</span>
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="aspect-square rounded-lg bg-[#22223b]"></div>
              <div className="aspect-square rounded-lg bg-[#4a4e69]"></div>
              <div className="aspect-square rounded-lg bg-[#9a8c98]"></div>
              <div className="aspect-square rounded-lg bg-[#c9ada7]"></div>
            </div>
          </div>

          {/* Dark Theme */}
          <div className="bg-[#f0ebd8] rounded-xl p-6 shadow-lg">
            <div className="bg-[#000000] rounded-lg p-6 mb-6">
              <h3 className="text-white text-xl font-semibold">
                Lorem <span className="text-[#fca311]">Ipsum</span>
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="aspect-square rounded-lg bg-[#000000]"></div>
              <div className="aspect-square rounded-lg bg-[#14213d]"></div>
              <div className="aspect-square rounded-lg bg-[#fca311]"></div>
              <div className="aspect-square rounded-lg bg-[#f5f2e6]"></div>
            </div>
          </div>
        </div>

        {/* Design System Labels */}
        <div className="mt-16 text-white text-center space-y-2">
          <div className="text-lg font-semibold">Design System Components</div>
          <div className="text-sm opacity-75">Color Palettes • Typography Scale • Component Variations</div>
        </div>
      </div>
    </div>
  )
}
