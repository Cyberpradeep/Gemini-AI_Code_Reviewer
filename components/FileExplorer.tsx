import React from 'react';
import { ProjectFile } from '../App';
import { FolderIcon } from './icons/FolderIcon';
import LanguageIcon from './LanguageIcon';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  children?: { [key: string]: TreeNode };
  isFile: boolean;
}

const buildFileTree = (files: ProjectFile[]): { [key: string]: TreeNode } => {  
  const root: { [key: string]: TreeNode } = {};

  files.forEach(file => {
    let currentLevel = root;
    const pathParts = file.path.split('/');
    
    pathParts.forEach((part, index) => {
      const isFile = index === pathParts.length - 1;
      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          path: isFile ? file.path : pathParts.slice(0, index + 1).join('/'),
          isFile: isFile,
          children: isFile ? undefined : {},
        };
      }
      if (!isFile) {
         currentLevel = currentLevel[part].children!;
      }
    });
  });

  return root;
};

const FileTree: React.FC<{
  tree: { [key: string]: TreeNode },
  activeFile: string | null,
  onSelectFile: (path: string) => void,
  level?: number,
}> = ({ tree, activeFile, onSelectFile, level = 0 }) => {
  const sortedKeys = Object.keys(tree).sort((a, b) => {
    const nodeA = tree[a];
    const nodeB = tree[b];
    // Directories first, then files, then alphabetically
    if (!nodeA.isFile && nodeB.isFile) return -1;
    if (nodeA.isFile && !nodeB.isFile) return 1;
    return a.localeCompare(b);
  });

  return (
    <div>
      {sortedKeys.map(key => {
        const node = tree[key];
        const language = node.path.split('.').pop()?.toLowerCase() || 'plaintext';
        
        if (node.isFile) {
          return (
            <button
              key={node.path}
              onClick={() => onSelectFile(node.path)}
              className={`w-full text-left flex items-center gap-2 pr-2 py-1 rounded-md transition-colors text-sm ${
                activeFile === node.path
                  ? 'bg-light-accent/10 text-light-accent dark:bg-dark-accent/20 dark:text-dark-accent'
                  : 'text-light-label-secondary dark:text-dark-label-secondary hover:bg-light-fill-primary dark:hover:bg-dark-fill-primary'
              }`}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <LanguageIcon language={language} className="h-4 w-4 flex-shrink-0" />
              <span className="truncate font-medium">{node.name}</span>
            </button>
          );
        }

        return (
          <div key={node.path}>
            <div className="flex items-center gap-2 pr-2 py-1 text-sm font-semibold text-light-label-primary dark:text-dark-label-primary" style={{ paddingLeft: `${12 + level * 16}px` }}>
              <FolderIcon className="h-4 w-4 flex-shrink-0" />
              <span>{node.name}</span>
            </div>
            {node.children && (
              <FileTree
                tree={node.children}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};


const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFile, onSelectFile }) => {
  const fileTree = buildFileTree(files);

  return (
    <div className="p-2 h-full">
      <FileTree tree={fileTree} activeFile={activeFile} onSelectFile={onSelectFile} />
    </div>
  );
};

export default FileExplorer;