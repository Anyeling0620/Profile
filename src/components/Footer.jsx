import ICPLogo from "../assets/ICP-Logo.png"
export default function Footer() {
  return <footer className="p-1 bg-primary/80 relative">
          <div className="flex p-2 items-center justify-center">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-foreground duration-200 transform
                transition-transform hover:text-blue-600"
            >
              <img src={ICPLogo} alt="备案图标" className="w-6 h-6" />
            </a>
            <span className="items-center ">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground duration-200 transform
                transition-transform hover:text-white"
              >
                粤ICP备2025492035号
              </a>
            </span>
          </div>
  </footer>
}
