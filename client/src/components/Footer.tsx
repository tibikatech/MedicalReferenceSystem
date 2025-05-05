export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} MediRefs. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-gray-300">
              <span className="sr-only">Terms of Service</span>
              <span className="text-xs">Terms of Service</span>
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-300">
              <span className="sr-only">Privacy Policy</span>
              <span className="text-xs">Privacy Policy</span>
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-300">
              <span className="sr-only">Contact</span>
              <span className="text-xs">Contact</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
