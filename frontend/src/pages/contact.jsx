import React from 'react';
import './contact.css'; // Make sure to import the CSS file

export const Contact = () => {
    return (
        <div className="contact-container">
            <h1>Contact Us</h1>
            <p>
                Have a question or want to share your thoughts? We're all ears at CharityCentral!
                Whether you have feedback to improve our platform, need help with a transaction, or just want to share your ideas,
                we're here to listen. Email us at <a href="mailto:support@charitycentral.com">support@charitycentral.com</a> or check out our
                <a href="/aboutus"> About Us page</a> to learn more about what we do. Your input helps us make giving back through our platform even better.
            </p>
        </div>
    );
};
