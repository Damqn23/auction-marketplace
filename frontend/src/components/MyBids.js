import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './MyBids.module.css';

const MyBids = () => {
  const [bids, setBids] = useState({
    winning_now: [],
    won: [],
    losing_now: [],
    lost: [],
  });

  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    axios.get('http://localhost:8000/api/my-bids/', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      setBids(response.data);
    })
    .catch(error => {
      console.error('Error fetching bids:', error);
    });
  }, []);

  const renderBidCard = (item) => (
    <div key={item.id} className={styles.bidCard} onClick={() => navigate(`/auction/${item.id}`)}>
      {item.images && item.images.length > 0 ? (
        <img src={item.images[0].image} alt={item.title} className={styles.productImage} />
      ) : (
        <div className={styles.noImage}>No image available</div>
      )}
      <h3>{item.title}</h3>
      <p>Current Bid: ${item.current_bid}</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Bids</h1>

      <button onClick={() => navigate('/my-bid-history')} className={styles.historyButton}>
        View All Bid History
      </button>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Winning Now</h2>
        {bids.winning_now.length > 0 ? (
          <div className={styles.bidList}>
            {bids.winning_now.map(renderBidCard)}
          </div>
        ) : (
          <p className={styles.emptyMessage}>No current winning bids.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Won</h2>
        {bids.won.length > 0 ? (
          <div className={styles.bidList}>
            {bids.won.map(renderBidCard)}
          </div>
        ) : (
          <p className={styles.emptyMessage}>No auctions won.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Losing Now (You Can Bid)</h2>
        {bids.losing_now.length > 0 ? (
          <div className={styles.bidList}>
            {bids.losing_now.map(renderBidCard)}
          </div>
        ) : (
          <p className={styles.emptyMessage}>No current losing bids.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Lost</h2>
        {bids.lost.length > 0 ? (
          <div className={styles.bidList}>
            {bids.lost.map(renderBidCard)}
          </div>
        ) : (
          <p className={styles.emptyMessage}>No lost auctions.</p>
        )}
      </section>
    </div>
  );
};

export default MyBids;
