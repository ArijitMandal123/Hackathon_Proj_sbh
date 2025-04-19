import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Function to add a sample hackathon to Firestore
export async function addSampleHackathon(hackathonData) {
    try {
        const hackathonsCollection = collection(db, 'hackathons');
        const docRef = await addDoc(hackathonsCollection, hackathonData);
        console.log("Sample hackathon added with ID: ", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding sample hackathon: ", error);
        throw error;
    }
}

// Function to add multiple sample hackathons
export async function addSampleHackathons() {
    const sampleHackathons = [
        {
            name: "Global AI Hackathon 2023",
            description: "Join the Global AI Hackathon to build innovative AI solutions for real-world problems. This hackathon brings together developers, designers, and AI enthusiasts from around the world to collaborate on cutting-edge projects.",
            startDate: "2023-11-15T09:00:00",
            endDate: "2023-11-17T18:00:00",
            location: "Virtual Event",
            isVirtual: true,
            prize: "$10,000 in prizes including cash, mentorship, and cloud credits",
            eligibility: "Open to all developers, designers, and AI enthusiasts. Teams can have 1-4 members.",
            registration: "Registration is free and open until November 10, 2023.",
            tags: ["AI", "Machine Learning", "Virtual", "Global"],
            websiteUrl: "https://example.com/global-ai-hackathon",
            registrationUrl: "https://example.com/global-ai-hackathon/register",
            imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            name: "Blockchain Innovation Challenge",
            description: "The Blockchain Innovation Challenge is a 48-hour hackathon focused on building decentralized applications and solutions using blockchain technology. Participants will work with industry experts and mentors to create innovative blockchain solutions.",
            startDate: "2023-12-01T10:00:00",
            endDate: "2023-12-03T16:00:00",
            location: "Tech Hub, San Francisco, CA",
            isVirtual: false,
            prize: "$15,000 in prizes including cryptocurrency, mentorship, and incubation opportunities",
            eligibility: "Open to all developers, designers, and blockchain enthusiasts. Teams can have 2-5 members.",
            registration: "Registration is $50 per person and includes meals, swag, and access to workshops.",
            tags: ["Blockchain", "Cryptocurrency", "DeFi", "Smart Contracts"],
            websiteUrl: "https://example.com/blockchain-innovation",
            registrationUrl: "https://example.com/blockchain-innovation/register",
            imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            name: "Climate Tech Hackathon",
            description: "The Climate Tech Hackathon brings together innovators to develop solutions addressing climate change. Participants will work on projects related to renewable energy, carbon reduction, sustainable agriculture, and environmental monitoring.",
            startDate: "2023-10-20T09:00:00",
            endDate: "2023-10-22T17:00:00",
            location: "Green Innovation Center, Boston, MA",
            isVirtual: false,
            prize: "$20,000 in prizes including cash, mentorship, and potential investment opportunities",
            eligibility: "Open to all developers, designers, and climate tech enthusiasts. Teams can have 1-4 members.",
            registration: "Registration is free and includes meals, workshops, and networking events.",
            tags: ["Climate", "Sustainability", "Green Tech", "Renewable Energy"],
            websiteUrl: "https://example.com/climate-tech-hackathon",
            registrationUrl: "https://example.com/climate-tech-hackathon/register",
            imageUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            name: "Healthcare Innovation Sprint",
            description: "The Healthcare Innovation Sprint is a virtual hackathon focused on developing solutions to improve healthcare delivery, patient outcomes, and medical research. Participants will work with healthcare professionals to address real challenges in the industry.",
            startDate: "2023-09-10T10:00:00",
            endDate: "2023-09-12T18:00:00",
            location: "Virtual Event",
            isVirtual: true,
            prize: "$12,000 in prizes including cash, mentorship, and potential pilot opportunities with healthcare providers",
            eligibility: "Open to all developers, designers, and healthcare enthusiasts. Teams can have 1-5 members.",
            registration: "Registration is free and includes access to healthcare data APIs and mentorship from industry experts.",
            tags: ["Healthcare", "Digital Health", "Virtual", "Medical Tech"],
            websiteUrl: "https://example.com/healthcare-innovation",
            registrationUrl: "https://example.com/healthcare-innovation/register",
            imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        },
        {
            name: "Web3 Developer Summit",
            description: "The Web3 Developer Summit is a three-day hackathon and conference focused on building the next generation of decentralized applications. Join leading Web3 developers, designers, and entrepreneurs to build innovative solutions on blockchain platforms.",
            startDate: "2023-08-05T09:00:00",
            endDate: "2023-08-07T17:00:00",
            location: "Crypto Hub, Miami, FL",
            isVirtual: false,
            prize: "$25,000 in prizes including cryptocurrency, mentorship, and incubation opportunities",
            eligibility: "Open to all developers, designers, and Web3 enthusiasts. Teams can have 2-4 members.",
            registration: "Registration is $75 per person and includes conference access, meals, and networking events.",
            tags: ["Web3", "Blockchain", "DeFi", "NFTs"],
            websiteUrl: "https://example.com/web3-summit",
            registrationUrl: "https://example.com/web3-summit/register",
            imageUrl: "https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
        }
    ];

    try {
        for (const hackathon of sampleHackathons) {
            await addSampleHackathon(hackathon);
        }
        console.log("All sample hackathons added successfully");
    } catch (error) {
        console.error("Error adding sample hackathons: ", error);
        throw error;
    }
}

// Function to fetch hackathons with optional filters
export async function fetchHackathons(filter = 'all') {
    try {
        const hackathonsCollection = collection(db, 'hackathons');
        let hackathonQuery = query(hackathonsCollection, orderBy('startDate', 'desc'));
        
        // Apply filter if not 'all'
        if (filter !== 'all') {
            const now = new Date();
            if (filter === 'upcoming') {
                hackathonQuery = query(hackathonsCollection, where('startDate', '>', now), orderBy('startDate', 'asc'));
            } else if (filter === 'ongoing') {
                hackathonQuery = query(hackathonsCollection, 
                    where('startDate', '<=', now), 
                    where('endDate', '>=', now), 
                    orderBy('startDate', 'desc'));
            } else if (filter === 'past') {
                hackathonQuery = query(hackathonsCollection, where('endDate', '<', now), orderBy('endDate', 'desc'));
            }
        }
        
        const hackathonSnapshot = await getDocs(hackathonQuery);
        return hackathonSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching hackathons: ", error);
        throw error;
    }
}

// Function to fetch a single hackathon by ID
export async function fetchHackathonById(hackathonId) {
    try {
        const hackathonDoc = doc(db, 'hackathons', hackathonId);
        const hackathonSnapshot = await getDoc(hackathonDoc);
        
        if (hackathonSnapshot.exists()) {
            return {
                id: hackathonSnapshot.id,
                ...hackathonSnapshot.data()
            };
        } else {
            throw new Error("Hackathon not found");
        }
    } catch (error) {
        console.error("Error fetching hackathon: ", error);
        throw error;
    }
} 