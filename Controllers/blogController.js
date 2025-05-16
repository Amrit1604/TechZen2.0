const blogController = {};

// Sample blog posts data
blogController.getBlogPosts = () => {
  return [
    {
      title: "The Future of AI in 2025",
      image: "/img-vid/ai-future.jpg",
      tag: "Artificial Intelligence",
      date: "May 15, 2025",
      readMoreLink: "/blogs/ai-future-2025",
      excerpt: "Exploring the upcoming trends in artificial intelligence..."
    },
    {
      title: "New iPhone 17 Rumors",
      image: "/img-vid/iphone.jpg",
      tag: "Gadgets",
      date: "May 10, 2025",
      readMoreLink: "/blogs/iphone-17-rumors",
      excerpt: "What to expect from Apple's next flagship device..."
    },
    {
      title: "Quantum Computing Breakthrough",
      image: "/img-vid/quantum.jpg",
      tag: "Technology",
      date: "May 5, 2025",
      readMoreLink: "/blogs/quantum-breakthrough",
      excerpt: "Scientists achieve major progress in quantum computing..."
    },
    {
      title: "Top 10 Tech Startups to Watch",
      image: "/img-vid/startups.jpg",
      tag: "Business",
      date: "April 30, 2025",
      readMoreLink: "/blogs/top-startups-2025",
      excerpt: "The most promising tech startups of the year..."
    },
    {
      title: "Cybersecurity Essentials for 2025",
      image: "/img-vid/cybersecurity.jpg",
      tag: "Security",
      date: "April 25, 2025",
      readMoreLink: "/blogs/cybersecurity-essentials",
      excerpt: "How to protect your digital assets in the current threat landscape..."
    },
    {
      title: "The Rise of 6G Technology",
      image: "/img-vid/6g.jpg",
      tag: "Connectivity",
      date: "April 20, 2025",
      readMoreLink: "/blogs/6g-technology",
      excerpt: "What 6G will mean for the future of communications..."
    }
  ];
};

module.exports = blogController;