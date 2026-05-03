import DiagnosisScreen from "@/components/DiagnosisScreen";

export const metadata = {
    title: "ClaimGuard — AI Bill Diagnosis",
    description:
        "Upload your medical bill and watch our AI agent scan for overcharges in real-time.",
        robots: {
                index: false,
                follow: false,
        },
};

export default function AppPage() {
    return <DiagnosisScreen />;
}
