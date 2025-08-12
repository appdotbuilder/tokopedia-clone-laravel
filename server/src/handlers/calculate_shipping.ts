interface ShippingOption {
    courier: string;
    service: string;
    cost: number;
    estimated_days: number;
}

export async function calculateShipping(destination: string, weight: number): Promise<ShippingOption[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is calculating shipping costs and options.
    // Should integrate with shipping API (e.g., RajaOngkir) to get real rates
    // based on destination address and package weight.
    return Promise.resolve([
        {
            courier: "JNE",
            service: "Regular",
            cost: 10000,
            estimated_days: 3
        },
        {
            courier: "TIKI",
            service: "Express",
            cost: 15000,
            estimated_days: 1
        }
    ]);
}