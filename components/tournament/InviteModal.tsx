"use client"

interface TournamentMember {
  id: number
  name: string
  avatar?: string
}

type InviteModalTab = "invite" | "copy-link"

interface InviteModalProps {
  isOpen: boolean
  members: TournamentMember[]
  activeTab: InviteModalTab
  onTabChange: (tab: InviteModalTab) => void
  onClose: () => void
}

export function InviteModal({ isOpen, members, activeTab, onTabChange, onClose }: InviteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#0D1321] text-[24px] font-bold">Invite</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="flex mb-6">
          {(["invite", "copy-link"] as InviteModalTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 text-center py-2 border-b-2 font-medium transition-colors ${
                activeTab === tab ? "border-[#0D1321] text-[#0D1321]" : "border-gray-300 text-[#9a8c98] hover:text-[#4a4e69]"
              }`}
            >
              {tab === "invite" ? "Invite" : "Copy link"}
            </button>
          ))}
        </div>

        <div>
          <h3 className="text-[#0D1321] text-[16px] font-medium mb-4">Who Has Access</h3>
          <div className="space-y-3">
            {members.length > 0 ? (
              members.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{user.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-[#4a4e69] text-[16px]">{user.name}</span>
                  </div>
                  <span className="text-[#9a8c98] text-[14px]">Participant</span>
                </div>
              ))
            ) : (
              <div className="text-center text-[#9a8c98] text-[14px] py-4">No tournament members yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
