## TODO

[ ] add in missing fields from table
[ ] manually spot check records to verify write
[ ] remove buttons and launch refresh based on visitor
[ ] use last updated data to selectivly update
[ ] move update inits to backend - run on server startup and each new visitor/launch
[ ] save data from site - allow to reprocess computed fields just from the db
[ ]  rework to a manual table with infintie scrolling and filtering


reactive table needs to:
allow sorting by another field (for date)



future
tests to verify integrity / scraping
add map of properties
add filtering / searching
add acounts and saved searches with email alerts




{ key: 'saleType', label: ''},
            { key: 'lastUpdated', label: ''},
            { key: 'billableOwner', label: '' },
            { key: 'legalDescription', label: '' },
            { key: 'parcel', label: 'Parcel' },
            { key: 'pin', label: 'PIN' },
            { key: 'buildingValue', label: 'Building Value' },
            { key: 'acerage', label: 'Acerage' },
            { key: 'township', label: 'Township' },
            { key: 'location', label: 'Location' },
            { key: 'landUse', label: 'Land Use' },
            { key: 'homestead', label: 'Homestead' },
            { key: 'class', label: 'Class' },
            { key: 'landValue', label: 'Land Value' },
            { key: 'saleAmount', label: 'Sale Amount' },
            { key: 'saleDate', label: 'Sale Date' }


	<table>
		<thead>
			<th>Sale Type</th>
			<th>Last Updated</th>
			<th>Owner</th>
			<th>Legal Description</th>
			<th>PIN</th>
		</thead>
		<tbody>
			{{#each properties}}
				<tr>
					<td>{{saleType}}</td>
					<td>{{lastUpdated}}</td>
					<td>{{billableOwner}}</td>
					<td>{{legalDescription}}</td>
					<td>{{parcel}}</td>
					<td>{{pin}}</td>
					<td>{{buildingValue}}</td>
					<td>{{acerage}}</td>
					<td>{{township}}</td>
					<td>{{location}}</td>
					<td>{{landUse}}</td>
					<td>{{homestead}}</td>
					<td>{{class}}</td>
					<td>{{landValue}}</td>
					<td>{{saleAmount}}</td>
					<td>{{saleDate}}</td>
				</tr>
			{{/each}}
		</tbody>