import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-spinner">
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <span className="loader-icon">🏥</span>
      </div>
      <p className="loader-text">Loading...</p>
    </div>
  );
};

export default Loader;
