import BrowseShows from './pages/BrowseShows';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BrowseShows": BrowseShows,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
