import type { IPricing } from "../types";

export const pricingData: IPricing[] = [
    {
        name: "Basic",
        price: 29,
        period: "month",
        features: [
            "50 AI Thumbnails/mo",
            "Basic Templates",
            "Standard Resolution",
            "No watermark",
            "Email Support"
        ],
        mostPopular: false
    },

    {
        name: "Pro",
        price: 79,
        period: "month",
        features: [
            "Unlimited AI Thumbnails",
            "Premium Templates",
            "4K Resolution",
            "A/B Testing Tools",
            "Priority Support",
            "Custom fonts",
            "Brand Kit Analysis"
        ],
        mostPopular: true
    },
    {
        name: "Enterprise",
        price: 199,
        period: "month",
        features: [
            "Everything in pro",
            "API acess",
            "Team Collabaoration",
            "Custom branding",
            "Dedicated Account Manager"
        ],
        mostPopular: false
    }
];