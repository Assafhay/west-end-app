import BrowseShows from './pages/BrowseShows';
import Home from './pages/Home';
import About from './pages/About';
import Blog from './pages/Blog';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BrowseShows": BrowseShows,
    "Home": Home,
    "About": About,
    "Blog": Blog,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
