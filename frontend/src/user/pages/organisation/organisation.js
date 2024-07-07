import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./organisation.css";


export const Organisation = () => {
    const [organisations, setOrganisations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        axios.get('https://ict2216group30.store/api/organisations/')
            .then(response => {
                setOrganisations(response.data);
                setLoading(false);
            })
            .catch(error => {
                setError(error);
                setLoading(false);
            });
    }, []);


    if (loading) {
        return <div>Loading...</div>;
    }


    if (error) {
        return <div>Error fetching organisations</div>;
    }


    return (
        <div className="organisationPageContainer">
            <h1>Organisations</h1>
            <div className="organisation">
                {organisations.map(organisation => (
                    <div key={organisation.id} className="organisationCard">
                        <img src={organisation.image} alt={organisation.name} className="organisationImage" />
                        <h2>{organisation.name}</h2>
                        <p>{organisation.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
