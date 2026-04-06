export default function Header() {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="">
        <h1 className="text-[32px] font-semibold text-[#101828]">Applications</h1>
        <p className="text-[#475467] mt-1">Track and manage all your job applications</p>
      </div>
      <div className="flex items-center w-full md:w-auto">
        <select className=" border border-[#E4E7EC] rounded-[10px] px-4 py-2.5 text-[14px] font-medium text-[#475467] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6934]/20 appearance-none  min-w-[140px] w-full md:w-auto">
          <option>Most recent</option>
          <option>Oldest first</option>
          <option>Company Name</option>
        </select>
      </div>
    </div>
  );
}
