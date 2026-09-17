import React from 'react';
import { ChevronRight, Home, Folder, HardDrive, Cloud, Github, Star, Trash2 } from 'lucide-react';
import { FolderItem, NavSection } from '../types';

interface BreadcrumbProps {
  currentSection: NavSection;
  selectedFolderId: string | null;
  folders: FolderItem[];
  onSelectFolder: (folderId: string | null) => void;
  onSelectSection: (section: NavSection) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentSection,
  selectedFolderId,
  folders,
  onSelectFolder,
  onSelectSection,
}) => {
  const getSectionTitle = () => {
    switch (currentSection) {
      case 'github_storage':
        return {
          label: 'Bộ nhớ Online',
          icon: <Cloud className="w-4 h-4 text-emerald-600" />,
        };
      case 'starred':
        return {
          label: 'Có gắn dấu sao',
          icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" />,
        };
      case 'trash':
        return {
          label: 'Thùng rác',
          icon: <Trash2 className="w-4 h-4 text-rose-500" />,
        };
      case 'my_drive':
      default:
        return {
          label: 'Bộ nhớ Offline',
          icon: <HardDrive className="w-4 h-4 text-sky-600" />,
        };
    }
  };

  // Build folder path hierarchy
  const folderPath: FolderItem[] = [];
  let currId = selectedFolderId;
  while (currId) {
    const found = folders.find((f) => f.id === currId);
    if (found) {
      folderPath.unshift(found);
      currId = found.parentId;
    } else {
      break;
    }
  }

  const sectionInfo = getSectionTitle();

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 py-1 overflow-x-auto no-scrollbar">
      <button
        type="button"
        onClick={() => {
          onSelectFolder(null);
          onSelectSection(currentSection);
        }}
        className="flex items-center gap-1.5 font-semibold text-slate-800 hover:text-blue-600 transition-colors whitespace-nowrap"
      >
        <span>{sectionInfo.icon}</span>
        <span>{sectionInfo.label}</span>
      </button>

      {folderPath.map((folder, idx) => {
        const isLast = idx === folderPath.length - 1;
        return (
          <React.Fragment key={folder.id}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <button
              type="button"
              onClick={() => onSelectFolder(folder.id)}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                isLast
                  ? 'font-bold text-slate-900 pointer-events-none'
                  : 'text-slate-600 hover:text-blue-600 font-medium'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-blue-500" />
              <span>{folder.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
