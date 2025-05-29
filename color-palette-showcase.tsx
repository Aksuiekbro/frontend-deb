export default function Component() {
  const colorSchemes = [
    {
      title: "Welcome to Debetter",
      headerBg: "#22223b",
      colors: ["#22223b", "#4a4e69", "#9a8c98", "#c9ada7"],
    },
    {
      title: "Lorem Ipsum",
      headerBg: "#006d77",
      colors: ["#006d77", "#83c5be", "#e29578", "#9a8c98"],
    },
    {
      title: "Lorem Ipsum",
      headerBg: "#3e5c76",
      colors: ["#22223b", "#3e5c76", "#9a8c98", "#f2e9e4"],
    },
    {
      title: "Lorem Ipsum",
      headerBg: "#000000",
      colors: ["#000000", "#14213d", "#fca311", "#f5f2e6"],
    },
  ]

  const gradientColors = ["#14213d", "#22223b", "#4a4e69", "#748cab", "#f0ebd8"]

  return (
    <div className="min-h-screen bg-[#444444] p-8 font-hikasami">
      <div className="max-w-6xl mx-auto">
        {/* Header text */}
        <div className="text-white text-sm mb-8 space-y-4 max-w-2xl">
          <p className="text-2xl font-medium">
            H1: A platform for meaningful discussions, structured debates, and intellectual growth
          </p>
          <p className="text-xl font-medium">
            H2: A platform for meaningful discussions, structured debates, and intellectual growth
          </p>
          <p className="text-lg font-medium">
            H3: A platform for meaningful discussions, structured debates, and intellectual growth
          </p>
          <p className="text-base font-medium">
            H4: A platform for meaningful discussions, structured debates, and intellectual growth
          </p>
          <p className="text-sm font-medium">
            H5: A platform for meaningful discussions, structured debates, and intellectual growth
          </p>
          <p className="text-xs font-medium">
            H6: A platform for meaningful discussions, structured debates, and intellectual growth
          </p>
        </div>

        {/* Main color scheme card */}
        <div className="mb-12 flex justify-center">
          <div className="bg-[#f2e9e4] rounded-lg p-6 w-80">
            <div className="bg-[#22223b] rounded-lg p-6 mb-4">
              <h2 className="text-white text-lg font-medium">
                Welcome to <span className="text-[#83c5be]">Debetter</span>
              </h2>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {["#22223b", "#4a4e69", "#748cab", "#9a8c98"].map((color, index) => (
                  <div key={index} className="aspect-square rounded" style={{ backgroundColor: color }}></div>
                ))}
              </div>

              <p className="text-[#22223b] text-sm font-medium">Debetter</p>

              <div className="grid grid-cols-4 gap-2">
                {["#22223b", "#4a4e69", "#748cab", "#9a8c98"].map((color, index) => (
                  <div key={index} className="aspect-square rounded" style={{ backgroundColor: color }}></div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {["#22223b", "#4a4e69", "#748cab", "#9a8c98"].map((color, index) => (
                  <div key={index} className="aspect-square rounded" style={{ backgroundColor: color }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gradient strip */}
        <div className="mb-12 flex justify-center">
          <div className="bg-white rounded-lg p-4 w-80">
            <div className="flex rounded-lg overflow-hidden h-16">
              {gradientColors.map((color, index) => (
                <div key={index} className="flex-1" style={{ backgroundColor: color }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Color scheme grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {colorSchemes.map((scheme, index) => (
            <div key={index} className="bg-[#f2e9e4] rounded-lg p-6">
              <div className="rounded-lg p-6 mb-4" style={{ backgroundColor: scheme.headerBg }}>
                <h3 className="text-white text-lg font-medium">
                  {scheme.title === "Welcome to Debetter" ? (
                    <>
                      Welcome to <span className="text-[#83c5be]">Debetter</span>
                    </>
                  ) : (
                    <>
                      Lorem <span className="text-[#fca311]">Ipsum</span>
                    </>
                  )}
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {scheme.colors.map((color, colorIndex) => (
                  <div key={colorIndex} className="aspect-square rounded" style={{ backgroundColor: color }}></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
