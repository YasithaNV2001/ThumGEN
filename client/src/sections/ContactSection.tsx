import SectionTitle from "../components/SectionTitle";
import { ArrowRightIcon, MailIcon, UserIcon } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

// No backend needed: opens the visitor's mail app with the message pre-filled
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!CONTACT_EMAIL) {
        toast.error("Contact form is not configured yet");
        return;
    }
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const message = String(form.get("message") || "");
    const subject = encodeURIComponent(`ThumGEN enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n${name} <${email}>`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
};

export default function ContactSection() {
    return (
        <div id="contact" className="px-4 md:px-16 lg:px-24 xl:px-32 scroll-mt-24">
            <SectionTitle text1="Contact"
            text2="Grow your channel"
            text3="Have questions about our AI? Ready to scale your views? Let's talk." />
            <form onSubmit={handleSubmit} className='grid sm:grid-cols-2 gap-3 sm:gap-5 max-w-2xl mx-auto text-slate-300 mt-16 w-full' >
                <motion.div
                    initial={{ y: 150, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
                >
                    <p className='mb-2 font-medium'>Your name</p>
                    <div className='flex items-center pl-3 rounded-lg border border-slate-700 focus-within:border-pink-500'>
                        <UserIcon className='size-5' />
                        <input name='name' type="text" required placeholder='Enter your name' className='w-full p-3 outline-none' />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 150, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
                >
                    <p className='mb-2 font-medium'>Email id</p>
                    <div className='flex items-center pl-3 rounded-lg border border-slate-700 focus-within:border-pink-500'>
                        <MailIcon className='size-5' />
                        <input name='email' type="email" required placeholder='Enter your email' className='w-full p-3 outline-none' />
                    </div>
                </motion.div>

                <motion.div className='sm:col-span-2'
                    initial={{ y: 150, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 240, damping: 70, mass: 1 }}
                >
                    <p className='mb-2 font-medium'>Message</p>
                    <textarea name='message' required rows={8} placeholder='Enter your message' className='focus:border-pink-500 resize-none w-full p-3 outline-none rounded-lg border border-slate-700' />
                </motion.div>

                <motion.button type='submit' className='w-max flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-10 py-3 rounded-full'
                    initial={{ y: 150, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
                >
                    Submit
                    <ArrowRightIcon className="size-5" />
                </motion.button>
            </form>
        </div>
    );
}