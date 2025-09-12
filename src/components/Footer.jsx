import React from "react";

const Footer = () => {
  return (
    <footer className="mt-10 mb-2 text-center">
      {" "}
      <p className="mt-6 text-sm text-gray-500">
        Powered by{" "}
        <a
          href="https://www.ysinnovations.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-gray-700 hover:underline "
        >
          YS Innovations
        </a>
      </p>
    </footer>
  );
};

export default Footer;
