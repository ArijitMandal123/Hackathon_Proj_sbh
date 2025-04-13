import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

function HackathonListingsPage() {
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'ongoing', 'past'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTags, setFilterTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterIsVirtual, setFilterIsVirtual] = useState('');
    const [sortBy, setSortBy] = useState('startDate');
    const [sortOrder, setSortOrder] = useState('desc');

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
                
                setHackathons(hackathonList);
            } catch (err) {
                console.error("Error fetching hackathons:", err);
                setError("Failed to fetch hackathons: " + err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchHackathons();
    }, []);

    const handleAddTag = () => {
        if (newTag.trim() && !filterTags.includes(newTag.trim())) {
            setFilterTags([...filterTags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFilterTags(filterTags.filter(tag => tag !== tagToRemove));
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

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

    const filteredAndSortedHackathons = hackathons
        .filter(hackathon => {
            // Filter by status (all, upcoming, ongoing, past)
            const now = new Date();
            const startDate = new Date(hackathon.startDate);
            const endDate = new Date(hackathon.endDate);
            
            let matchesStatus = true;
            if (filter === 'upcoming') {
                matchesStatus = startDate > now;
            } else if (filter === 'ongoing') {
                matchesStatus = startDate <= now && endDate >= now;
            } else if (filter === 'past') {
                matchesStatus = endDate < now;
            }
            
            // Filter by search term
            const matchesSearch = 
                hackathon.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hackathon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hackathon.location?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Filter by tags if any tags are selected
            const matchesTags = filterTags.length === 0 || 
                              filterTags.every(tag => 
                                  hackathon.tags?.some(hackathonTag => 
                                      hackathonTag.toLowerCase().includes(tag.toLowerCase())
                                  )
                              );
            
            // Filter by location
            const matchesLocation = !filterLocation || 
                                  hackathon.location?.toLowerCase().includes(filterLocation.toLowerCase());
            
            // Filter by virtual status
            const matchesVirtual = filterIsVirtual === '' || 
                                 (filterIsVirtual === 'true' && hackathon.isVirtual) ||
                                 (filterIsVirtual === 'false' && !hackathon.isVirtual);
            
            return matchesStatus && matchesSearch && matchesTags && 
                   matchesLocation && matchesVirtual;
        })
        .sort((a, b) => {
            let valueA = a[sortBy] || '';
            let valueB = b[sortBy] || '';
            
            // Handle date fields
            if (sortBy === 'startDate' || sortBy === 'endDate') {
                valueA = new Date(valueA).getTime();
                valueB = new Date(valueB).getTime();
            }
            
            // Handle string comparison
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sortOrder === 'asc' 
                    ? valueA.localeCompare(valueB) 
                    : valueB.localeCompare(valueA);
            }
            
            // Handle numeric comparison
            return sortOrder === 'asc' 
                ? valueA - valueB 
                : valueB - valueA;
        });

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

    // Get unique locations and tags for filter dropdowns
    const uniqueLocations = [...new Set(hackathons.map(hackathon => hackathon.location).filter(Boolean))];
    const allTags = hackathons.flatMap(hackathon => hackathon.tags || []).filter(Boolean);
    const uniqueTags = [...new Set(allTags)];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#0C0950]">Hackathon Events</h1>
                <Link 
                    to="/add-hackathon" 
                    className="bg-[#261FB3] text-white px-4 py-2 rounded-md hover:bg-[#161179] transition-colors"
                >
                    Add Hackathon
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 mb-8">
                <div className="mb-6">
                    <label className="block text-[#161179] font-medium mb-2">Search Hackathons</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, description, or location"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-[#161179] font-medium mb-2">Filter by Status</label>
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
                    
                    <div>
                        <label className="block text-[#161179] font-medium mb-2">Filter by Location</label>
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        >
                            <option value="">All Locations</option>
                            {uniqueLocations.map(location => (
                                <option key={location} value={location}>{location}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-[#161179] font-medium mb-2">Filter by Type</label>
                        <select
                            value={filterIsVirtual}
                            onChange={(e) => setFilterIsVirtual(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        >
                            <option value="">All Types</option>
                            <option value="true">Virtual Only</option>
                            <option value="false">In-Person Only</option>
                        </select>
                    </div>
                </div>
                
                <div className="mb-4">
                    <label className="block text-[#161179] font-medium mb-2">Filter by Tags</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a tag to filter"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        />
                        <button
                            onClick={handleAddTag}
                            className="bg-[#261FB3] text-white px-4 py-2 rounded hover:bg-[#161179] transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {filterTags.map((tag, index) => (
                            <span
                                key={index}
                                className="bg-[#FBE4D6] text-[#0C0950] px-3 py-1 rounded-full text-sm flex items-center gap-2"
                            >
                                {tag}
                                <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="text-[#0C0950] hover:text-red-600"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                    {uniqueTags.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">Popular tags:</p>
                            <div className="flex flex-wrap gap-2">
                                {uniqueTags.slice(0, 10).map((tag, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (!filterTags.includes(tag)) {
                                                setFilterTags([...filterTags, tag]);
                                            }
                                        }}
                                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs hover:bg-gray-200"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                        <label className="text-[#161179] font-medium mr-2">Sort by:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => handleSort(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#261FB3] focus:border-transparent"
                        >
                            <option value="startDate">Start Date</option>
                            <option value="name">Name</option>
                            <option value="location">Location</option>
                            <option value="endDate">End Date</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="ml-2 text-[#261FB3] hover:text-[#161179]"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                    <div className="text-[#161179]">
                        {filteredAndSortedHackathons.length} hackathons found
                    </div>
                </div>
            </div>

            {filteredAndSortedHackathons.length === 0 ? (
                <div className="bg-[#FBE4D6] text-[#0C0950] p-6 rounded-lg shadow-md">
                    <p className="text-lg">No hackathons found for the selected filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedHackathons.map((hackathon) => (
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
                                            <span className="text-gray-700">
                                                {hackathon.location}
                                                {hackathon.isVirtual && (
                                                    <span className="ml-1 text-xs bg-[#FBE4D6] text-[#0C0950] px-2 py-0.5 rounded-full">Virtual</span>
                                                )}
                                            </span>
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