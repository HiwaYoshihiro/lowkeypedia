export default function SearchBar({
  action = '/tim-kiem',
  placeholder = 'Tìm tuyển thủ, đội tuyển...',
  defaultValue = '',
  large = false,
}: {
  action?: string;
  placeholder?: string;
  defaultValue?: string;
  large?: boolean;
}) {
  return (
    <form action={action} method="GET" className="flex w-full gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`flex-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wiki-blue focus:border-wiki-blue ${
          large ? 'px-5 py-3.5 text-lg' : 'px-4 py-2.5 text-sm'
        }`}
      />
      <button
        type="submit"
        className={`bg-wiki-blue hover:bg-wiki-darkblue text-white font-semibold rounded-lg whitespace-nowrap ${
          large ? 'px-6 py-3.5 text-lg' : 'px-5 py-2.5 text-sm'
        }`}
      >
        Tìm kiếm
      </button>
    </form>
  );
}
