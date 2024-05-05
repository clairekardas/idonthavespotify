import LoadingIndicator from '../components/loading-indicator';
import SearchBar from '../components/search-bar';
import Footer from '../components/footer';

export default function Home({
  source,
  children,
}: {
  source?: string;
  children?: JSX.Element;
}) {
  return (
    <div class="flex flex-col">
      <LoadingIndicator />
      <main class="flex flex-1 flex-col items-center justify-start p-2 min-screen-3">
        <div class="my-7 text-center sm:my-16">
          <h1 class="text-4xl uppercase md:text-5xl lg:text-6xl">I don't have Spotify</h1>
          <h2 class="mt-6 text-xs md:text-sm lg:text-lg">
            Paste a Spotify link and listen on other platforms.
          </h2>
        </div>
        <SearchBar source={source} />
        <div class="my-4">
          <div id="search-results">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
