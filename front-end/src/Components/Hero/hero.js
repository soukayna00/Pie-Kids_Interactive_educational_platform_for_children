import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './hero.css';

const moneySkills = [
  {
    title: 'Save for a Goal',
    description: 'Pick something you want and work out how much to save.',
    color: 'green',
    image: '/assets/peach.png',
  },
  {
    title: 'Spend Wisely',
    description: 'Decide what you need now and what can wait.',
    color: 'red',
    image: '/assets/toad.png',
  },
  {
    title: 'Make a Budget',
    description: 'Give your money a plan before you spend it.',
    color: 'gold',
    image: '/assets/luigi.png',
  },
];
const learningSteps = [
  {
    title: 'Pick a Lesson',
    description: 'Start with a money topic you’re curious about.',
  },
  {
    title: 'Try an Activity',
    description: 'Practice making a choice in an everyday situation.',
  },
  {
    title: 'Track Your Progress',
    description: 'See what you’ve completed and pick what to try next.',
  },
];

const Hero = () => {
  const levelsHeaderRef = useRef(null);

  useEffect(() => {
    const header = levelsHeaderRef.current;

    if (!header || typeof IntersectionObserver !== 'function') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle('pie-levels__header--visible', entry.isIntersecting);
      },
      { threshold: 0.5 },
    );

    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pie-home">
      <section className="pie-hero" aria-labelledby="pie-home-title">
        <div className="pie-home__container pie-hero__layout">
          <div className="pie-hero__art">
            <img src="/assets/mario.png" alt="" fetchPriority="high" />
          </div>

          <div className="pie-hero__panel">
            <h1 id="pie-home-title">
              Level Up Your <span>Money Skills</span>
            </h1>
            <p>
              Save for something you want, make smart spending choices, and
              learn how to give your money a plan.
            </p>

            <div className="pie-hero__actions">
              <Link to="/courses" className="pie-home__button">
                Start Playing <span aria-hidden="true">▸</span>
              </Link>
              <a href="#how-it-works" className="pie-hero__secondary">
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="pie-mission" aria-labelledby="pie-mission-title">
        <div className="pie-home__container pie-mission__layout">
          <div className="pie-mission__card">
            <h2 id="pie-mission-title">Your Money Mission</h2>
            <p>
              You’re saving for something you really want. Then you spot a
              treat you could buy today. What would you do?
            </p>
            <p>
              PIE KIDZ gives kids a place to practice choices like this through
              interactive lessons and activities.
            </p>
          </div>

          <img src="/assets/mario-punch.png" alt="" loading="lazy" />
        </div>
      </section>

      <section className="pie-levels" aria-labelledby="pie-levels-title">
  <div className="pie-home__container">
    <header className="pie-levels__header" ref={levelsHeaderRef}>
      <div>
        <h2 id="pie-levels-title">Build Your Money Skills</h2>
        <p>Practice saving, spending, and making a budget.</p>
      </div>

      <img
        className="pie-levels__toad"
        src="/assets/toad.png"
        alt=""
        loading="lazy"
      />
    </header>

    <ol className="pie-levels__grid" role="list">
      {moneySkills.map(({ title, description, color, image }, index) => (
        <li key={title} className={`pie-level pie-level--${color}`}>
          <div className="pie-level__stage">
            <span className="pie-level__number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>

            <img
              className="pie-level__character"
              src={image}
              alt=""
              loading="lazy"
            />
          </div>

          <div className="pie-level__body">
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </li>
      ))}
    </ol>

    <Link to="/courses" className="pie-home__button">
      Explore Lessons <span aria-hidden="true">▸</span>
    </Link>
  </div>
</section>

      <section id="how-it-works" className="pie-how" aria-labelledby="pie-how-title">
        <div className="pie-home__container">
          <h2 id="pie-how-title">How It Works</h2>

          <ol className="pie-how__steps" role="list">
            {learningSteps.map(({ title, description }, index) => (
              <li key={title}>
                <span className="pie-how__number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
};

export default Hero;