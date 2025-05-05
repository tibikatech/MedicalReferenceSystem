import { useState } from "react";
import SearchBar from "./SearchBar";
import { MoonIcon, SunIcon, BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-neutral-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <svg 
                className="h-8 w-8 text-primary" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" 
                />
              </svg>
              <span className="ml-2 text-xl font-semibold text-primary dark:text-primary-400">
                MedTest Reference
              </span>
            </div>
            
            <div className="ml-10 w-full max-w-lg">
              <SearchBar onSearch={onSearch} />
            </div>
          </div>
          
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Bookmarks"
              className="p-1 rounded-full text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:text-neutral-400 dark:hover:text-neutral-300"
            >
              <BookmarkIcon className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className="ml-3 p-1 rounded-full text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:text-neutral-400 dark:hover:text-neutral-300"
            >
              {theme === "dark" ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => setIsLoggedIn(!isLoggedIn)}
            >
              {isLoggedIn ? "Sign out" : "Sign in"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
