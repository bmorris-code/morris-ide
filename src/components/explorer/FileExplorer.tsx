import { useState, useCallback, useEffect, useRef } from 'react';
import { FilePlus, FolderOpen, ChevronRight, ChevronDown, RefreshCw, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../store';
import { useEditorStore } from '../../store';
import { useTerminalStore } from '../../store';
import { useElectron } from '../../hooks';
import type { FileNode } from '../../types/project';
import { generateFileId, getFileIcon } from '../../types/project';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onFileClick: (node: FileNode) => void;
}

function FileTreeItem({ node, depth, onFileClick }: FileTreeItemProps) {
  const { expandedFolders, toggleFolder, selectedPath, selectPath } = useProjectStore();
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    selectPath(node.path);
    if (node.type === 'directory') {
      toggleFolder(node.path);
    } else {
      onFileClick(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-gray-800 rounded text-sm ${
          isSelected ? 'bg-violet-900/30 text-violet-400' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown size={14} className="text-gray-500" />
            ) : (
              <ChevronRight size={14} className="text-gray-500" />
            )}
            <FolderOpen size={14} className="text-yellow-500" />
          </>
        ) : (
          <>
            <span className="w-[14px]" />
            <span className="text-xs">{getFileIcon(node.name, 'file')}</span>
          </>
        )}
        <span className="truncate ml-1">{node.name}</span>
      </div>
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer() {
  const { fileTree, selectedPath, setFileTree, currentProject, setCurrentProject, setLoading, isLoading } = useProjectStore();
  const { openFile } = useEditorStore();
  const { setCurrentDirectory } = useTerminalStore();
  const electron = useElectron();
  const [error, setError] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);

  // Load directory tree recursively
  const loadDirectory = useCallback(async (dirPath: string): Promise<FileNode | null> => {
    const result = await electron.readDir(dirPath);
    if (!result.success || !result.items) {
      return null;
    }

    const children: FileNode[] = [];

    // Sort: directories first, then files, alphabetically
    const sortedItems = result.items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of sortedItems) {
      // Skip hidden files and node_modules
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;

      const node: FileNode = {
        id: generateFileId(),
        name: item.name,
        path: item.path,
        type: item.isDirectory ? 'directory' : 'file',
        extension: item.isFile ? item.name.split('.').pop() : undefined,
      };

      if (item.isDirectory) {
        const subTree = await loadDirectory(item.path);
        if (subTree) {
          node.children = subTree.children;
        }
      }

      children.push(node);
    }

    return {
      id: generateFileId(),
      name: dirPath.split(/[/\\]/).pop() || dirPath,
      path: dirPath,
      type: 'directory',
      children,
    };
  }, [electron]);

  const refreshCurrentProject = useCallback(async () => {
    if (!currentProject?.path) return;

    setLoading(true);
    const tree = await loadDirectory(currentProject.path);
    if (tree) {
      setFileTree(tree);
    }
    setLoading(false);
  }, [currentProject?.path, loadDirectory, setFileTree, setLoading]);

   // Open folder dialog
   const handleOpenFolder = async () => {
     setLoading(true);
     setError(null);

     try {
       const result = await electron.openFolder();
       if (!result.success) {
         setError(result.error || 'Failed to open folder');
         setLoading(false);
         return;
       }

       if (!result.path) {
         setError('No folder path returned');
         setLoading(false);
         return;
       }

       const tree = await loadDirectory(result.path);
       if (!tree) {
         setError('Failed to load folder contents');
         setLoading(false);
         return;
       }

       setFileTree(tree);
       setCurrentProject({
         id: `proj_${Date.now()}`,
         name: tree.name,
         path: result.path,
         rootNode: tree,
         createdAt: Date.now(),
         lastOpenedAt: Date.now(),
       });
       setCurrentDirectory(result.path);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Unknown error opening folder');
     } finally {
       setLoading(false);
     }
   };

  // Handle file click - open in editor
  const handleFileClick = async (node: FileNode) => {
    if (node.type === 'file') {
      const result = await electron.readFile(node.path);
      if (result.success && result.content !== undefined) {
        openFile(node.path, result.content);
      }
    }
  };

  // Refresh current folder
  const handleRefresh = async () => {
    await refreshCurrentProject();
  };

   const createItem = async (type: 'file' | 'directory') => {
     if (!currentProject?.path) {
       setError('Open a folder before creating files.');
       return;
     }

     const name = window.prompt(type === 'file' ? 'New file name' : 'New folder name');
     if (!name?.trim()) return;

     const separator = currentProject.path.includes('\\') ? '\\' : '/';
     const targetPath = `${currentProject.path}${separator}${name.trim()}`;
     
     try {
       let result;
       if (type === 'file') {
         result = await electron.api?.fs.createFile(targetPath, '');
       } else {
         result = await electron.api?.fs.createDir(targetPath);
       }

       if (!result?.success) {
         setError(result?.error || `Failed to create ${type}`);
         return;
       }

       if (type === 'file') {
         openFile(targetPath, '');
       }
       await refreshCurrentProject();
     } catch (err) {
       setError(err instanceof Error ? err.message : `Failed to create ${type}`);
     }
   };

   const renameSelected = async () => {
     if (!selectedPath) {
       setError('Select a file or folder to rename.');
       return;
     }

     const currentName = selectedPath.split(/[/\\]/).pop() || selectedPath;
     const nextName = window.prompt('Rename to', currentName);
     if (!nextName?.trim() || nextName === currentName) return;

     const slash = Math.max(selectedPath.lastIndexOf('/'), selectedPath.lastIndexOf('\\'));
     const parent = selectedPath.slice(0, slash);
     const separator = selectedPath.includes('\\') ? '\\' : '/';
     const nextPath = `${parent}${separator}${nextName.trim()}`;
     
     try {
       const result = await electron.api?.fs.renameFile(selectedPath, nextPath);
       
       if (!result?.success) {
         setError(result?.error || 'Rename failed');
         return;
       }

       await refreshCurrentProject();
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Rename failed');
     }
   };

   const deleteSelected = async () => {
     if (!selectedPath) {
       setError('Select a file or folder to delete.');
       return;
     }

     if (!window.confirm(`Delete ${selectedPath}?`)) return;
     
     try {
       const result = await electron.api?.fs.deleteFile(selectedPath);
       
       if (!result?.success) {
         setError(result?.error || 'Delete failed');
         return;
       }

       await refreshCurrentProject();
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Delete failed');
     }
   };

  useEffect(() => {
    if (!electron.isElectron || !currentProject?.path) return;

    let disposed = false;

    electron.watchPath(currentProject.path).then((result) => {
      if (!result.success && !disposed) {
        setError(result.error || 'Failed to watch project files');
      }
    });

    const removeChangeListener = electron.onFileChanged((event) => {
      if (event.rootPath !== currentProject.path) return;

      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        const tree = await loadDirectory(currentProject.path);
        if (tree) {
          setFileTree(tree);
          setError(null);
        }
      }, 250);
    });

    const removeErrorListener = electron.onFileWatchError((event) => {
      if (event.rootPath === currentProject.path) {
        setError(event.error);
      }
    });

    return () => {
      disposed = true;
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      removeChangeListener();
      removeErrorListener();
      electron.unwatchPath(currentProject.path);
    };
  }, [electron, currentProject?.path, loadDirectory, setFileTree]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-violet-400">Explorer</h2>
        <div className="flex gap-1">
          <button
            onClick={() => createItem('file')}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-violet-400"
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={() => createItem('directory')}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-violet-400"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            onClick={renameSelected}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-violet-400"
            title="Rename Selected"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={deleteSelected}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-red-400"
            title="Delete Selected"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-violet-400"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenFolder}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-violet-400"
            title="Open Folder"
          >
            <FolderOpen size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {!electron.isElectron ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            <p>File system access requires Electron.</p>
            <p className="mt-2">Run as desktop app to enable.</p>
          </div>
        ) : !fileTree ? (
          <div className="p-4 text-center">
            <button
              onClick={handleOpenFolder}
              className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-2 mx-auto"
            >
              <FolderOpen size={16} />
              Open a Folder
            </button>
          </div>
        ) : (
          <FileTreeItem node={fileTree} depth={0} onFileClick={handleFileClick} />
        )}
        {error && <p className="text-red-400 text-xs p-2">{error}</p>}
      </div>
    </div>
  );
}
