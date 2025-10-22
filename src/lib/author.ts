export interface AuthorInfo {
  name: string;
  email: string;
  github: string;
  linkedin?: string;
  figma?: string;
}

export const author: AuthorInfo = {
  name: "Kristian Garza",
  email: "kj.garza@gmail.com",
  github: "https://github.com/kjgarza",
  linkedin: "https://www.linkedin.com/in/kjgarza",
  figma: "https://www.figma.com/@kristiangarza",
};
