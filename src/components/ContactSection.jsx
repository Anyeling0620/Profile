import { Mail, MapPin, Phone, Send } from "lucide-react";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/useToast";
import { useState } from "react";
export default function ContactSection() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast({
        title: "消息已发送！",
        description: "感谢你的留言，我会尽快回复你。",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <section id="contact" className="py-24 px-4 relative bg-secondary/30">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          联系<span className="text-primary">我</span>
        </h2>

        <p className="text-center text-foreground mb-12 max-w-2xl mx-auto">
          如果你有项目想法、合作机会，或者只是想聊聊技术，欢迎随时联系我。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="p-8">
            <h3 className="text-2xl font-semibold mb-6">联系方式</h3>

            <div className="space-y-6 justify-center w-full">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary"></Mail>
                </div>

                <div className="">
                  <h4 className="font-medium">邮箱</h4>
                  <a
                    href="3463645195@qq.com"
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    3463645195@qq.com
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Phone className="h-6 w-6 text-primary"></Phone>
                </div>

                <div className="">
                  <h4 className="font-medium">电话</h4>
                  <a
                    href="tel:+86 none"
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    +86 none
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary"></MapPin>
                </div>

                <div className="">
                  <h4 className="font-medium">位置</h4>
                  <a className="text-foreground hover:text-primary transition-colors">
                    中国，山东
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <h4 className="font-medium mb-4">社交平台</h4>
              <div className="flex space-x-8 justify-center">
                <a href="">
                  <svg
                    t="1783183182814"
                    class="icon"
                    viewBox="0 0 1190 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="5515"
                    width="20"
                    height="20"
                  >
                    <path
                      d="M1053.773298 160.744414c47.629428-29.760217 89.293731-83.354769 107.162943-142.888284-47.629428 29.773298-101.210899 53.633797-154.792371 59.533515C964.466485 29.760217 898.980927 0 827.530244 0 690.607085 0 583.431061 113.114986 583.431061 256.00327c0 17.85613 0 41.664303 5.952043 59.533515-202.421799-11.917168-381.022343-113.114986-506.054497-267.907357C65.485558 83.341688 53.633797 130.984198 53.633797 178.613626c0 89.293731 35.725341 166.696458 101.2109 214.325885-41.677385 0-113.114986-11.917168-113.114987-29.773298v5.952043c0 125.019073 89.306813 226.229972 202.408718 250.051228-17.85613 5.952043-41.664303 11.904087-59.520433 11.904086s-29.773298 0-47.629428-5.952043c29.760217 101.197818 119.040867 178.600544 226.229972 178.600544C279.811444 875.146591 172.674664 916.837057 59.533515 916.837057c-17.85613 0-41.677385 0-59.533515-5.952043a678.742242 678.742242 0 0 0 375.0703 113.114986c446.507901 0 696.559128-392.92643 696.559128-732.28447v-35.71226c47.629428-35.725341 89.306813-83.354769 119.040867-130.984197-35.725341 17.869211-83.341688 29.773298-136.92316 35.725341z m0 0"
                      fill="#1DA1F2"
                      p-id="5516"
                    ></path>
                  </svg>
                </a>
                <a href="">
                  <svg
                    t="1783183205446"
                    class="icon"
                    viewBox="0 0 1325 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="6513"
                    width="20"
                    height="20"
                  >
                    <path
                      d="M1121.552807 84.974123A1081.785559 1081.785559 0 0 0 851.889272 0.064435a4.094935 4.094935 0 0 0-4.335814 2.107687c-12.345026 22.702803-23.545878 46.068022-33.602557 69.854779a995.069282 995.069282 0 0 0-302.904774 0 711.495011 711.495011 0 0 0-34.024095-69.854779A4.215375 4.215375 0 0 0 472.686218 0.064435C379.52644 16.383957 288.895886 44.928065 202.962464 84.974123a3.854057 3.854057 0 0 0-1.806589 1.565711C29.529909 346.628446-17.561847 600.333777 5.502274 850.967906c0.120439 1.204393 0.722636 2.348566 1.74637 3.131421a1092.986412 1092.986412 0 0 0 330.786466 169.518278 4.215375 4.215375 0 0 0 4.636912-1.56571c25.533126-35.228488 48.17571-72.564663 67.686872-111.586988a4.275594 4.275594 0 0 0 0.180659-3.492739 4.215375 4.215375 0 0 0-2.469006-2.408785 719.203125 719.203125 0 0 1-103.336897-49.982299 4.335814 4.335814 0 0 1-0.421537-7.166137c6.925258-5.239108 13.850517-10.658876 20.474676-16.259302a4.034716 4.034716 0 0 1 4.335814-0.602196c216.790693 100.386135 451.526838 100.386135 665.788307 0a4.034716 4.034716 0 0 1 4.335814 0.602196c6.744599 5.600426 13.549418 11.020194 20.595116 16.259302a4.335814 4.335814 0 0 1-0.421538 7.226357c-33.000361 19.511162-67.566433 36.192002-103.336897 49.861859a4.335814 4.335814 0 0 0-2.228126 6.021964c19.752041 38.721227 42.394624 76.057402 67.566432 111.466548a4.215375 4.215375 0 0 0 4.636912 1.62593 1089.373234 1089.373234 0 0 0 331.388663-169.518278 4.335814 4.335814 0 0 0 1.68615-3.131421c27.701033-289.656454-46.248681-541.374537-195.83426-764.428072a3.3723 3.3723 0 0 0-1.746369-1.62593zM323.642616 562.937382c0-74.67235 52.752402-135.373744 119.114442-135.373744 66.843797 0 120.077956 61.30359 119.054223 135.373744 0 74.61213-52.752402 135.373744-119.054223 135.373744-65.278087 0-119.054222-60.821833-119.054222-135.373744z m559.319989 135.373744c-65.278087 0-119.054222-60.821833-119.054222-135.373744 0-74.67235 52.752402-135.373744 119.054222-135.373744 66.843797 0 120.077956 61.30359 119.054222 135.373744 0 74.61213-52.210425 135.373744-119.054222 135.373744z"
                      fill="#1296db"
                      p-id="6514"
                    ></path>
                  </svg>
                </a>
                <a href="">
                  <svg
                    t="1783183236346"
                    class="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="7599"
                    width="20"
                    height="20"
                  >
                    <path
                      d="M739.84 232.96a51.2 51.2 0 1 0 51.2 51.2 51.2 51.2 0 0 0-51.2-51.2z m196.266667 103.253333a323.84 323.84 0 0 0-19.626667-103.68 210.773333 210.773333 0 0 0-49.493333-75.52 200.533333 200.533333 0 0 0-75.52-49.066666 311.466667 311.466667 0 0 0-103.68-20.053334C642.56 85.333333 628.053333 85.333333 512 85.333333s-130.56 0-175.786667 2.56a311.466667 311.466667 0 0 0-103.68 20.053334 203.946667 203.946667 0 0 0-75.52 49.066666 200.533333 200.533333 0 0 0-49.066666 75.52 311.466667 311.466667 0 0 0-20.053334 103.68C85.333333 381.44 85.333333 395.946667 85.333333 512s0 130.56 2.56 175.786667a311.466667 311.466667 0 0 0 20.053334 103.68 200.533333 200.533333 0 0 0 49.066666 75.52 203.946667 203.946667 0 0 0 75.52 49.066666 311.466667 311.466667 0 0 0 103.68 20.053334C381.44 938.666667 395.946667 938.666667 512 938.666667s130.56 0 175.786667-2.56a311.466667 311.466667 0 0 0 103.68-20.053334 200.533333 200.533333 0 0 0 75.52-49.066666 206.933333 206.933333 0 0 0 49.493333-75.52 323.84 323.84 0 0 0 19.626667-103.68c0-45.226667 2.56-59.733333 2.56-175.786667s0-130.56-2.56-175.786667zM859.306667 682.666667a239.36 239.36 0 0 1-14.506667 79.36 130.56 130.56 0 0 1-32 49.066666 136.106667 136.106667 0 0 1-49.066667 32 239.36 239.36 0 0 1-79.36 14.506667c-42.666667 2.133333-58.453333 2.56-170.666666 2.56s-128 0-170.666667-2.56a244.48 244.48 0 0 1-82.773333-12.8 139.52 139.52 0 0 1-46.933334-32 128 128 0 0 1-31.573333-49.066667 236.373333 236.373333 0 0 1-17.066667-81.066666c0-42.666667-2.56-58.453333-2.56-170.666667s0-128 2.56-170.666667a236.373333 236.373333 0 0 1 14.933334-81.066666A128 128 0 0 1 213.333333 213.333333a133.973333 133.973333 0 0 1 46.933334-34.133333A244.48 244.48 0 0 1 341.333333 164.693333c42.666667 0 58.453333-2.56 170.666667-2.56s128 0 170.666667 2.56a239.36 239.36 0 0 1 79.36 14.506667 130.56 130.56 0 0 1 50.773333 34.133333 130.56 130.56 0 0 1 32 46.933334 239.36 239.36 0 0 1 14.506667 81.066666c2.133333 42.666667 2.56 58.453333 2.56 170.666667s-0.426667 128-2.56 170.666667zM512 293.12A218.88 218.88 0 1 0 731.306667 512 218.453333 218.453333 0 0 0 512 293.12z m0 360.96A142.08 142.08 0 1 1 654.08 512 142.08 142.08 0 0 1 512 654.08z"
                      p-id="7600"
                      fill="#d4237a"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-card p-8 rounded-lg shadow-xs">
            <h3 className="text-2xl font-semibold mb-6">发送消息</h3>
            <form action="" className="" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  你的姓名
                </label>
                <input
                  type="text"
                  id="name"
                  value="name"
                  required
                  className="w-full px-4 py-3 rounded-md border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary"
                  placeholder="Anyeling..."
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                >
                  你的邮箱
                </label>
                <input
                  type="text"
                  id="emali"
                  value="emali"
                  required
                  className="w-full px-4 py-3 rounded-md border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary"
                  placeholder="jojo@gmail.com"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-2"
                >
                  留言内容
                </label>
                <textarea
                  id="message"
                  value="message"
                  required
                  className="w-full px-4 py-3 rounded-md border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
                  placeholder="你好，我想和你聊聊..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "cosmic-button w-full flex items-center gap-2 justify-center",
                )}
              >
                {isSubmitting ? "发送中..." : "发送消息"}
                <Send size={16}></Send>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
