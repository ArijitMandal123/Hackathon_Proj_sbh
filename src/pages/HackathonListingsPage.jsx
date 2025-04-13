import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

function HackathonListingsPage() {
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'ongoing', 'past'

    useEffect(() => {
        async function fetchHackathons() {
            setLoading(true);
            setError(null);
            try {
                const hackathonsCollection = collection(db, 'hackathons');
                let hackathonQuery = query(hackathonsCollection, orderBy('startDate', 'desc'));
                
                // Get all hackathons first
                const hackathonSnapshot = await getDocs(hackathonQuery);
                let hackathonList = hackathonSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        // Convert Firestore Timestamps to ISO strings for display
                        startDate: data.startDate?.toDate?.()?.toISOString() || data.startDate,
                        endDate: data.endDate?.toDate?.()?.toISOString() || data.endDate
                    };
                });
                
                // Apply client-side filtering if needed
                if (filter !== 'all') {
                    const now = new Date();
                    hackathonList = hackathonList.filter(hackathon => {
                        const startDate = new Date(hackathon.startDate);
                        const endDate = new Date(hackathon.endDate);
                        
                        if (filter === 'upcoming') {
                            return startDate > now;
                        } else if (filter === 'ongoing') {
                            return startDate <= now && endDate >= now;
                        } else if (filter === 'past') {
                            return endDate < now;
                        }
                        return true;
                    });
                }
                
                setHackathons(hackathonList);
            } catch (err) {
                console.error("Error fetching hackathons:", err);
                setError("Failed to fetch hackathons: " + err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchHackathons();
    }, [filter]);

    const formatDate = (dateString) => {
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid date";
        }
    };

    const getStatusBadge = (startDate, endDate) => {
        try {
            const now = new Date();
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (now < start) {
                return <span className="bg-[#FBE4D6] text-[#0C0950] px-3 py-1 rounded-full text-sm font-medium">Upcoming</span>;
            } else if (now >= start && now <= end) {
                return <span className="bg-[#261FB3] text-white px-3 py-1 rounded-full text-sm font-medium">Ongoing</span>;
            } else {
                return <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">Past</span>;
            }
        } catch (error) {
            console.error("Error determining status:", error);
            return <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">Unknown</span>;
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#261FB3]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#0C0950]">Hackathon Events</h1>
                <div className="flex space-x-4">
                    <Link 
                        to="/add-hackathon" 
                        className="bg-[#261FB3] text-white px-4 py-2 rounded-md hover:bg-[#161179] transition-colors"
                    >
                        Add Hackathon
                    </Link>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setFilter('all')} 
                            className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-[#261FB3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setFilter('upcoming')} 
                            className={`px-4 py-2 rounded-md ${filter === 'upcoming' ? 'bg-[#261FB3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Upcoming
                        </button>
                        <button 
                            onClick={() => setFilter('ongoing')} 
                            className={`px-4 py-2 rounded-md ${filter === 'ongoing' ? 'bg-[#261FB3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Ongoing
                        </button>
                        <button 
                            onClick={() => setFilter('past')} 
                            className={`px-4 py-2 rounded-md ${filter === 'past' ? 'bg-[#261FB3] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Past
                        </button>
                    </div>
                </div>
            </div>

            {hackathons.length === 0 ? (
                <div className="bg-[#FBE4D6] text-[#0C0950] p-6 rounded-lg shadow-md">
                    <p className="text-lg">No hackathons found for the selected filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hackathons.map((hackathon) => (
                        <div key={hackathon.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                            <div className="h-48 overflow-hidden">
                                {hackathon.imageUrl ? (
                                    <img 
                                        src={hackathon.imageUrl} 
                                        alt={hackathon.name} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400">No image available</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="text-xl font-semibold text-[#0C0950]">{hackathon.name}</h2>
                                    {getStatusBadge(hackathon.startDate, hackathon.endDate)}
                                </div>
                                <p className="text-gray-600 mb-4 line-clamp-2">{hackathon.description}</p>
                                
                                <div className="mb-4">
                                    <div className="flex items-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#261FB3] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-gray-700">
                                            {formatDate(hackathon.startDate)} - {formatDate(hackathon.endDate)}
                                        </span>
                                    </div>
                                    
                                    {hackathon.location && (
                                        <div className="flex items-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#261FB3] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-gray-700">{hackathon.location}</span>
                                        </div>
                                    )}
                                    
                                    {hackathon.prize && (
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#261FB3] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                            <span className="text-gray-700">{hackathon.prize}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {hackathon.tags && hackathon.tags.map((tag, index) => (
                                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                
                                <div className="flex justify-between">
                                    <Link 
                                        to={`/hackathon/${hackathon.id}`} 
                                        className="text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
                                    >
                                        View Details
                                    </Link>
                                    {hackathon.websiteUrl && (
                                        <a 
                                            href={hackathon.websiteUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-[#261FB3] hover:text-[#161179] font-medium transition-colors duration-300"
                                        >
                                            Official Website
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default HackathonListingsPage; 