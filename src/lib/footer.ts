import { author } from './author';

export function Footer(): HTMLElement {
  const currentYear = new Date().getFullYear();
  const footer = document.createElement('footer');
  footer.className = 'text-base-content opacity-70 flex w-full flex-col items-center justify-center gap-3 px-4 pt-8 pb-8 font-mono text-sm mt-8';
  
  // Create links container
  const linksContainer = document.createElement('div');
  linksContainer.className = 'flex flex-wrap items-center justify-center gap-2';
  
  // Helper function to create a link
  const createLink = (text: string, href: string) => {
    const link = document.createElement('a');
    link.className = 'hover:text-primary hover:underline transition-colors';
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.href = href;
    link.textContent = text;
    return link;
  };
  
  // Helper function to create a separator
  const createSeparator = () => {
    const separator = document.createElement('span');
    separator.className = 'text-base-content opacity-50';
    separator.textContent = '·';
    return separator;
  };
  
  // Add links with separators
  const links = [];
  
  if (author.figma) {
    links.push(createLink('Figma', author.figma));
  }
  
  if (author.github) {
    links.push(createLink('GitHub', author.github));
  }
  
  if (author.linkedin) {
    links.push(createLink('LinkedIn', author.linkedin));
  }
  
  if (author.email) {
    links.push(createLink('Email', `mailto:${author.email}`));
  }
  
  // Add links with separators between them
  links.forEach((link, index) => {
    if (index > 0) {
      linksContainer.appendChild(createSeparator());
    }
    linksContainer.appendChild(link);
  });
  
  footer.appendChild(linksContainer);
  
  // Create copyright text
  const copyright = document.createElement('p');
  copyright.className = 'text-base-content opacity-60 text-xs';
  copyright.textContent = `Copyright © ${currentYear} ${author.name}`;
  footer.appendChild(copyright);
  
  return footer;
}
