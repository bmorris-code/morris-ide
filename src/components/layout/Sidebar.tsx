import { AlertTriangle, Folder, Search, Bot, Users, GitBranch, Shield, Puzzle, Settings } from 'lucide-react';

interface SidebarProps {
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
}

const menuItems = [
  { icon: Folder, action: 'files' },
  { icon: Search, action: 'search' },
  { icon: Bot, action: 'ai' },
  { icon: Users, action: 'agents' },
  { icon: GitBranch, action: 'git' },
  { icon: Shield, action: 'security' },
  { icon: AlertTriangle, action: 'problems' },
  { icon: Puzzle, action: 'plugins' },
  { icon: Settings, action: 'settings' },
];

export default function Sidebar({ activePanel, setActivePanel }: SidebarProps) {
  return (

    <aside className="w-16 bg-[#0a0a0f] border-r border-gray-800 flex flex-col items-center py-4 gap-3">

      {/* Navigation Items */}

      <nav className="flex flex-col gap-1 w-full px-3">

        {menuItems.map(({ icon: Icon, action }, index) => (

          <button

            key={index}

            onClick={() => {
              setActivePanel(action);
              console.log(`Sidebar clicked: ${action}`);
            }}

            className={`flex flex-col items-center py-3 px-2 rounded-lg transition-all duration-200 ${

              activePanel === action || (!activePanel && index === 0)

                ? 'bg-violet-600/20 text-violet-400 border-l-2 border-violet-400' 

                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'

            }`}

          >

            <Icon size={20} />

          </button>

        ))}

      </nav>

    </aside>

  );

}
