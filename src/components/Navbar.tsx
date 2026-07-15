const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <a href="/" className="text-lg font-bold">MJ Grand Hotel</a>
        <div>
          <a href="/menu" className="mx-2">Menu</a>
          <a href="/dining" className="mx-2">Dining</a>
          <a href="/booking" className="mx-2">Booking</a>
          <a href="/admin" className="mx-2">Admin</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
