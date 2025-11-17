"use client"

export function FeedbackSection() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-[#0D1321] text-[32px] font-bold mb-4">Tournament Feedback</h2>
          <p className="text-[#4a4e69] text-[18px]">
            Your feedback helps us improve future tournaments. Please share your thoughts and suggestions.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-300 p-8 mb-8">
          <h3 className="text-[#0D1321] text-[24px] font-bold mb-6">Submit Feedback</h3>

          <form className="space-y-6">
            <div>
              <label className="block text-[#0D1321] text-[16px] font-medium mb-3">Overall Tournament Rating</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" className="text-3xl text-gray-300 hover:text-yellow-400 transition-colors">
                    ⭐
                  </button>
                ))}
                <span className="ml-4 text-[#9a8c98] text-[14px]">Click to rate</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Organization Quality",
                "Judge Quality",
                "Venue & Facilities",
                "Communication",
              ].map((label) => (
                <div key={label}>
                  <label className="block text-[#0D1321] text-[16px] font-medium mb-3">{label}</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]">
                    <option value="">Select rating</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[#0D1321] text-[16px] font-medium mb-3">
                Additional Comments & Suggestions
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69] resize-vertical"
                placeholder="Please share your detailed feedback, suggestions for improvement, or any issues you encountered..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#0D1321] text-[16px] font-medium mb-3">Your Name (Optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-[#0D1321] text-[16px] font-medium mb-3">Email (Optional)</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-8 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors">
                Submit Feedback
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {[1, 2].map((item) => (
            <div key={item} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src="/placeholder-user.jpg"
                    alt="User avatar"
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      const target = event.target as HTMLImageElement
                      target.style.display = "none"
                      const fallback = target.nextElementSibling as HTMLDivElement | null
                      fallback?.classList.remove("hidden")
                    }}
                  />
                  <div className="hidden w-12 h-12 bg-gradient-to-br from-[#9a8c98] to-[#4a4e69] rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">H</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <h4 className="text-[#0D1321] text-[18px] font-semibold">Hair_ass</h4>
                  </div>
                  <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">
                    Actually I love debetter it is very simple and minimalistic. The design is very human!
                  </p>
                  <div className="flex items-center space-x-6 text-[#9a8c98] text-[14px]">
                    <button className="flex items-center space-x-2 hover:text-[#3E5C76] transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 01-2-2V7a2 2 0 012-2s0 0 0 0 1.53-.027 2.06-.06l5.474-.279a2 2 0 011.94 1.472c.087.462.087.957 0 1.419L14 10z" />
                      </svg>
                      <span>Like</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-[#3E5C76] transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2m0-12V2m7 10h4.764a2 2 0 001.789-2.894l-3.5-7A2 2 0 0015.263 1h-4.017c-.163 0-.326.02-.485.06L7 2" />
                      </svg>
                      <span>Dislike</span>
                    </button>
                    <span className="text-[#9a8c98]">2 min</span>
                    <button className="hover:text-[#3E5C76] transition-colors">Reply</button>
                    <button className="flex items-center space-x-1 hover:text-[#3E5C76] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                  </div>
                  <button className="mt-3 text-[#9a8c98] text-[14px] hover:text-[#3E5C76] transition-colors">View Replies (4)</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
