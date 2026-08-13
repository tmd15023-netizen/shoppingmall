function Hero() {
  return (
    <section className="hero" aria-label="메인 배너">
      <div className="hero__media" aria-hidden="true" />
      <div className="hero__overlay" aria-hidden="true" />
      <div className="hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow">
            A DAILY FESTIVAL FOR ME
            <span className="hero__firework" aria-hidden="true">
              <span className="hero__firework-burst">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="hero__firework-core">🎉</span>
              <span className="hero__firework-pang">팡!</span>
            </span>
          </p>
          <p className="hero__tagline">고민은 배송만 늦출뿐</p>
          <h1 className="hero__title">오늘의 쇼핑을 시작해 볼까요??</h1>
          <p className="hero__sub">바캉스 셀렉션 · 인기 상품을 만나보세요</p>
        </div>
      </div>
    </section>
  )
}

export default Hero
