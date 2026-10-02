import { useHashRoute } from './router';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { TopicPage } from './pages/TopicPage';
import { Review } from './pages/Review';
import { Mock } from './pages/Mock';
import { Tools } from './pages/Tools';
import { Guide } from './pages/Guide';

export default function App() {
  const route = useHashRoute();
  const [page, a, b] = route;

  let content;
  if (page === 'topic' && a) content = <TopicPage key={a} id={a} tab={b ?? 'learn'} />;
  else if (page === 'review') content = <Review />;
  else if (page === 'mock') content = <Mock />;
  else if (page === 'tools') content = <Tools />;
  else if (page === 'guide') content = <Guide />;
  else content = <Home />;

  return (
    <div className="app">
      <Sidebar route={route} />
      <main>{content}</main>
    </div>
  );
}
