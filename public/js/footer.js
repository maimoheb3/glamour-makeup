export function renderFooter() {
  const footer = document.getElementById('footer');
  footer.innerHTML = `
    <section class="newsletter">
      <h2>Stay Glamorous</h2>
      <p>Get the latest beauty trends, exclusive offers, and expert tips delivered to your inbox</p>
      <div class="newsletter-form">
        <input type="email" placeholder="Enter your email address" />
        <button>Subscribe</button>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-container">
        <div class="footer-col">
          <h3 class="brand">GLAMOUR</h3>
          <p>Your destination for premium beauty products and expert beauty advice.</p>
          <div class="social-icons">
            <span>F</span>
            <span>I</span>
            <span>T</span>
            <span>Y</span>
          </div>
        </div>

        <div class="footer-col">
          <h4>Shop</h4>
          <ul>
            <li>Makeup</li>
            <li>Skincare</li>
            <li>Fragrance</li>
            <li>Tools & Brushes</li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Customer Care</h4>
          <ul>
            <li>Contact Us</li>
            <li>Shipping Info</li>
            <li>Returns</li>
            <li>Size Guide</li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li>About Us</li>
            <li>Careers</li>
            <li>Press</li>
            <li>Sustainability</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        © 2024 Glamour. All rights reserved.
      </div>
    </footer>
  `;
}

