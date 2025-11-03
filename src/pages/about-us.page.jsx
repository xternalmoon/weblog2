import { Link } from "react-router-dom";
import brand from "../imgs/favicon.png";

const AboutUsPage = () => {
  return (
    <>
      {/* Section 1: About Us */}
      <section className="md:h-cover bg-transparent md:sticky top-24 justify-between items-center flex md:flex-row flex-col-reverse z-10">
        <div className="tracking-tighter md:w-1/2">
          <h1 className="text-3xl md:text-7xl font-gelasio">
            How It All Began..
          </h1>
          <h1 className="text-2xl text-justify md:text-left md:text-3xl mt-4">
            Every great story starts with a spark of inspiration, and ours is no
            exception. <br className="hidden md:show" /> A random brainstorming session fueled by
            curiosity, asking,{" "}
            <span className="text-2xl md:text-3xl font-gelasio text-gray-950 bg-logoGreen">
              “What if blogging wasn’t just about writing, but an immersive
              experience?”
            </span>{" "}
            That’s where the idea was born – to create a platform where bloggers
            could seamlessly blend creativity, technology, and community.
          </h1>
        </div>
        <div className="aspect-square">
          <img
            src={brand}
            alt="Brand Logo"
            className="h-36 w-36 md:w-full md:h-full aspect-square object-cover md:rotate-90 z-30"
          />
        </div>
      </section>

      {/* Section 2: AI Features */}
      <section className="h-cover bg-white relative z-20">
        <h1 className="text-3xl md:text-4xl mt-6 font-gelasio text-center">
          Intelligent{" "}
          <span className="text-3xl md:text-5xl font-gelasio text-logoGreen font-thin">
            AI*
          </span>{" "}
          Powered Features
        </h1>
        <div className="md:py-12 flex md:flex-row flex-col justify-center items-center gap-6">
          {/* Summarize Feature */}
          <div className="flex flex-col items-center p-6 rounded-lg text-black">
            <i className="fi fi-rs-thought-bubble text-4xl mb-4 text-logoGreen"></i>
            <h3 className="text-xl mb-2">Summarize</h3>
            <p className="text-center">
              Quickly summarize content to capture key ideas and insights.
            </p>
          </div>

          {/* Paraphrase Feature */}
          <div className="flex flex-col items-center p-6 rounded-lg text-black">
            <i className="fi fi-sr-attribution-pencil text-4xl mb-4 text-logoGreen"></i>
            <h3 className="text-xl mb-2">Paraphrase</h3>
            <p className="text-center">
              Reword text while maintaining its original meaning and context.
            </p>
          </div>

          {/* Smart Suggest Feature */}
          <div className="flex flex-col items-center p-6 rounded-lg text-black">
            <i className="fi fi-rr-bolt text-4xl mb-4 text-logoGreen"></i>
            <h3 className="text-xl mb-2">Smart Suggest</h3>
            <p className="text-center">
              Get intelligent recommendations and ideas based on your input.
            </p>
          </div>

          {/* Title Generator Feature */}
          <div className="flex flex-col items-center p-6 rounded-lg text-black">
            <i className="fi fi-rr-sparkles text-4xl mb-4 text-logoGreen"></i>
            <h3 className="text-xl mb-2">Title Generator</h3>
            <p className="text-center">
              Generate catchy and engaging titles for your content effortlessly.
            </p>
          </div>
        </div>

        <h1 className="mt-6 md:text-2xl text-justify font-gelasio md:text-center">
          New here? Begin by exploring our content. Delve into topics that pique
          your interest. Locate a post that offers a fresh perspective or a new
          way of looking at something you already know—and then share your
          thoughts and experiences.
        </h1>

        <h1 className="mt-12 md:text-3xl text-2xl font-gelasio text-center">
          So what are you waiting for? <br className="md:hidden" />
          <Link to="/editor">
            <span className="md:text-3xl text-2xl text-logoGreen font-gelasio">
              {" "}
              Start Writing..
            </span>{" "}
          </Link>
        </h1>

        {/* Footer */}
      </section>
      <section className="h-cover bg-white relative z-20">
        <div className="team">
          <h1 className="text-center font-gelasio md:text-4xl text-3xl mt-6">
            Behind the Code
          </h1>
          <div className="list w-full mt-6">
            <div className="item hover:bg-logoGreen hover:text-white hover:border-logoGreen transition-all duration-300 border-b-2 border-black w-full py-10 flex items-center justify-between p-4 hover:cursor-pointer">
              <div className="names text-xl md:text-3xl flex gap-20">
                <h3 className="hidden md:block text-logoGreen">01</h3>
                <h1>Tahmid Mohammad</h1>
              </div>
              <h3 className="md:text-2xl">Model Development</h3>
            </div>

            <div className="item hover:bg-logoGreen hover:text-white hover:border-logoGreen transition-all duration-300 border-b-2 border-black w-full py-10 flex items-center justify-between p-4 hover:cursor-pointer">
              <div className="names text-xl md:text-3xl flex gap-20">
                <h3 className="hidden md:block text-logoGreen">02</h3>
                <h1>Nishant Kale</h1>
              </div>
              <h3 className="md:text-2xl">Frontend</h3>
            </div>

            <div className="item hover:bg-logoGreen hover:text-white hover:border-logoGreen transition-all duration-300 border-b-2 border-black w-full py-10 flex items-center justify-between p-4 hover:cursor-pointer">
              <div className="names text-xl md:text-3xl flex gap-20">
                <h3 className="hidden md:block text-logoGreen">03</h3>
                <h1>Tahmid Mohammad</h1>
              </div>
              <h3 className="md:text-2xl">Backend & Integration</h3>
            </div>
          </div>
        </div>
        <footer className="absolute bottom-0 left-0 w-full flex border-t justify-center py-6 bg-white">
          <ul className="flex md:gap-8 gap-4 text-gray-500 text-lg">
            <li>
              <Link to="/" className="hover:text-logoGreen">
                Home
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-logoGreen">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms-of-service" className="hover:text-logoGreen">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-logoGreen">
                Contact
              </Link>
            </li>
          </ul>
        </footer>
      </section>
    </>
  );
};

export default AboutUsPage;
